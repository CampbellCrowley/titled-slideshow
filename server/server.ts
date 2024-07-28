// Create a basic Express server, that serves the static files from the dist folder.
//
// An endpoint will also be available for users to upload an image with a text description.
//
// This server will also serve a list of images that have been uploaded to the server.
// This list will automatically update when the stored images change.

import fs from "fs";
import express from "express";

const app = express();
const port = 3000;
const staticDir = "dist/web/";
const uploadDir = "uploads/";

app.use(express.static("dist/web/"));
app.use(express.static("uploads/"));
app.use(express.json());

let images: string[] = [];

const watchOpts = { persistent: false, recursive: true };

fs.watch(uploadDir, watchOpts, (event: string, filename: string) => {
  console.log(`Event: ${event} for file: ${filename}`);
  fs.readdir(uploadDir, (err: unknown, files: string[]) => {
    if (err) {
      console.error(err);
      return;
    }

    images = files;
  });
});

// Serve the list of images that can be viewed.
app.get("/image-list", (req: express.Request, res: express.Response) => {
  res.json(images);
});

// Serve the image file and metadata file.
app.get("/image/:filename", (req: express.Request, res: express.Response) => {
  const filename = req.params.filename;
  res.sendFile(`${uploadDir}${filename}`);
});

// Upload an image, and additional metadata about the image.
app.post("/upload", (req: express.Request, res: express.Response) => {
  const { image, metadata, name } = req.body;
  const imageBuffer = Buffer.from(image, "base64");

  fs.writeFile(`${uploadDir}${name}`, imageBuffer, (err: unknown) => {
    if (err) {
      console.error(err);
      res.status(500).send("Failed to save image");
      return;
    }
  });
  fs.writeFile(
    `${uploadDir}${name}.json`,
    JSON.stringify(metadata),
    (err: unknown) => {
      if (err) {
        console.error(err);
        res.status(500).send("Failed to save metadata");
        return;
      }
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
