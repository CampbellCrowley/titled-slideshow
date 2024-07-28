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

  private readonly imagePreview = document.getElementById(
    "preview",
  ) as HTMLImageElement;

  constructor() {
    this.submitButton.addEventListener("click", (evt) => {
      evt.preventDefault();
      this.uploadImage();
    });
    this.imageInput.addEventListener("change", () => {
      this.updatePreview();
    });
  }

  private updatePreview() {
    const file = this.imageInput.files?.[0];
    if (!file) {
      this.imagePreview.src = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.src = reader.result as string;
    };
    reader.readAsDataURL(file);
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
