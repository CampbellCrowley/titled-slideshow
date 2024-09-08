// Basic script to upload a file to a server

class SlideshowUploader {
  private readonly imageInput = document.getElementById(
    "image-input",
  ) as HTMLInputElement;
  private readonly titleInput = document.getElementById(
    "title-input",
  ) as HTMLInputElement;
  private readonly submitButton = document.getElementById(
    "upload-button",
  ) as HTMLButtonElement;
  private readonly previewButton = document.getElementById(
    "preview-button",
  ) as HTMLButtonElement;

  private readonly fileListContainer = document.getElementById(
    "file-list",
  ) as HTMLUListElement;

  private readonly imagePreview = document.getElementById(
    "preview",
  ) as HTMLImageElement;
  private readonly titlePreview = document.getElementById(
    "title-preview",
  ) as HTMLSpanElement;

  file_list: string[] = [];

  constructor() {
    this.submitButton.addEventListener("click", (evt) => {
      evt.preventDefault();
      this.uploadImage();
    });
    this.imageInput.addEventListener("change", () => {
      this.updatePreview();
    });
    this.previewButton.addEventListener("click", (evt) => {
      evt.preventDefault();
      this.updatePreview();
    });
    this.updateFileList();
  }

  private updateFileList() {
    fetch("/image-list")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch image list");
        }
        return response.json();
      })
      .then((data) => {
        console.log("New File List:", data);
        this.file_list = data;
        this.updateFileListUI();
      })
      .catch((error) => {
        console.error(error);
        this.fileListContainer.textContent = `Failed to fetch image list: ${error}`;
      });
  }

  private updateFileListUI() {
    this.fileListContainer.innerHTML = "";
    for (const filename of this.file_list) {
      const li = document.createElement("li");
      li.textContent = filename;
      li.classList.add(encodeURIComponent(filename));
      li.addEventListener("click", () => {
        this.showImage(filename);
      });
      this.fileListContainer.appendChild(li);
    }
  }

  private showImage(filename: string) {
    fetch(`/image/${filename}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch image");
        return response.blob();
      })
      .then((blob) => {
        this.imagePreview.src = URL.createObjectURL(blob);
        this.updateSelectedFile(filename);
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to fetch image");
      });
    fetch(`/image/${filename}.json`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch metadata");
        return response.json();
      })
      .then((data) => {
        this.titlePreview.textContent = data.title;
      })
      .catch((error) => {
        console.error(error);
        this.titlePreview.textContent = "Failed to fetch metadata";
      });
  }

  private updateSelectedFile(filename: string) {
    const selected = this.fileListContainer.querySelector(".selected");
    if (selected) selected.classList.remove("selected");

    if (!filename) return;

    const li = this.fileListContainer.getElementsByClassName(
      encodeURIComponent(filename),
    );
    if (li) li[0].classList.add("selected");
  }

  private updatePreview() {
    const file = this.imageInput.files?.[0];
    Array.from(
      this.fileListContainer.getElementsByClassName("warning"),
    ).forEach((li) => li.classList.remove("warning"));
    if (!file) {
      this.imagePreview.src = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.src = reader.result as string;
    };
    reader.readAsDataURL(file);

    // If filename already exists, warn by highlighting the filename in the list.
    const filename = file.name;
    const li = this.fileListContainer.getElementsByClassName(
      encodeURIComponent(filename),
    );
    if (li) li[0].classList.add("warning");
    if (this.file_list.includes(filename)) {
      this.updateSelectedFile(filename);
    } else {
      this.updateSelectedFile("");
    }
  }

  private uploadImage() {
    const file = this.imageInput.files?.[0];
    if (!file) {
      alert("No file selected");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.sendImage(file.name, reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  private sendImage(filename: string, image: string) {
    const metadata = {
      title: this.titleInput.value,
    };

    fetch("/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image,
        metadata,
        name: filename,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          alert("Failed to upload image");
        } else {
          alert("Image uploaded successfully");
          this.updateFileList();
        }
      })
      .catch((error) => {
        console.error(error);
        alert("Failed to upload image");
      });
  }
}

(window as unknown as { slideshow: SlideshowUploader }).slideshow =
  new SlideshowUploader();
