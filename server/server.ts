// Create a basic Express server, that serves the static files from the dist folder.
//
// An endpoint will also be available for users to upload an image with a text description.
//
// This server will also serve a list of images that have been uploaded to the server.
// This list will automatically update when the stored images change.

import fs from "fs";
import express from "express";
import path from "path";

const app = express();
const port = 3000;
const maxUploadSize = "100mb";
const distRoot = path.join(__dirname, "../");
const staticDir = path.join(distRoot, "web/");
const sourceDir = path.join(distRoot, "../web/");
const uploadDir = path.join(distRoot, "../uploads/");

console.log(`Static dir: ${staticDir}`);
console.log(`Source dir: ${sourceDir}`);
console.log(`Upload dir: ${uploadDir}`);

app.use(express.static(staticDir));
app.use(express.static(sourceDir));
app.use(express.static("uploads/"));
app.use(express.json({ limit: maxUploadSize }));

const watchOpts = { persistent: false, recursive: true };

// Make sure the upload directory exists.
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

let images: string[] = [];
let refreshTimeout: NodeJS.Timeout | null = null;

const updateImageList = () => {
  fs.readdir(uploadDir, (err: unknown, files: string[]) => {
    if (err) {
      console.error(err);
      return;
    }

    images = files.filter((file) => !file.endsWith(".json"));
    console.log("Updated image list:", images.length, images);
  });
};
updateImageList();

fs.watch(
  uploadDir,
  watchOpts,
  (event: string, filename: string | Buffer | null) => {
    console.log(`Event: ${event} for file: ${filename}`);
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }
    refreshTimeout = setTimeout(() => {
      refreshTimeout = null;
      updateImageList();
    }, 1000);
  },
);

// Serve the list of images that can be viewed.
app.get("/image-list", (req: express.Request, res: express.Response) => {
  res.json(images);
});

// Serve the image file and metadata file.
app.get("/image/:filename", (req: express.Request, res: express.Response) => {
  const filename = req.params.filename;
  res.sendFile(filename, { root: uploadDir }, (err: unknown) => {
    if (err && (err as { code: string }).code != "EPIPE") {
      console.error("Failed to serve image:", filename, err);
    } else {
      console.log(`Served: ${uploadDir}${filename}`);
    }
  });
});

// Upload an image, and additional metadata about the image.
app.post("/upload", async (req: express.Request, res: express.Response) => {
  const { image, metadata, name } = req.body;
  const imageBuffer = Buffer.from(image.split(",")[1], "base64");
  let waitFor = 2;

  const informStatus = (error: string | null) => {
    if (error) {
      console.error(error);
      res.status(500).send("Failed to save image");
      waitFor = 0;
    } else if (--waitFor === 0) {
      res.send("Image uploaded successfully");
    }
  };

  fs.writeFile(`${uploadDir}${name}`, imageBuffer, (err: unknown) => {
    informStatus(err as string);
  });
  fs.writeFile(
    `${uploadDir}${name}.json`,
    JSON.stringify(metadata),
    (err: unknown) => {
      informStatus(err as string);
    },
  );
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).send("Not found");
});

app.use((err: unknown, req: express.Request, res: express.Response) => {
  console.error(err);
  res.status(500).send("Internal server error");
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
