// Fetches images from the server, and facilitates animations between each image.
// There are two background elements and two image slide elements to help with
// fading between images.

class TitledSlideshow {
  private imageList: string[] = [];
  private currentImageIndex = -1;
  private currentElementIndex = 0;

  private readonly imageElements = [
    document.getElementById("slide-image-1") as HTMLImageElement,
    document.getElementById("slide-image-2") as HTMLImageElement,
  ];
  private readonly backgroundElements = [
    document.getElementById("background-image-1") as HTMLImageElement,
    document.getElementById("background-image-2") as HTMLImageElement,
  ];
  private readonly titleElements = [
    document.getElementById("slide-title-1") as HTMLParagraphElement,
    document.getElementById("slide-title-2") as HTMLParagraphElement,
  ];
  private readonly slideElements = [
    document.getElementById("slide-1") as HTMLDivElement,
    document.getElementById("slide-2") as HTMLDivElement,
  ];

  constructor() {
    this.fetchImageList();
  }

  private fetchImageList() {
    fetch("/image-list")
      .then((response) => response.json())
      .then((data) => {
        this.imageList = data;
        this.currentImageIndex = -1;
        console.log("Fetched image list", this.imageList);
        this.showNextImage();
      });
  }

  private showNextImage() {
    const nextImageIndex = (this.currentImageIndex + 1) % this.imageList.length;
    if (this.imageList.length === 0) {
      setTimeout(() => this.fetchImageList(), 10000);
      return;
    }
    const filename = this.imageList[nextImageIndex];
    this.currentImageIndex = nextImageIndex;

    const currentSlideElement = this.slideElements[this.currentElementIndex];
    const currentBackgroundElement = this.backgroundElements[this.currentElementIndex];
    const nextElementIndex = (this.currentElementIndex + 1) % 2;
    const nextSlideElement = this.slideElements[nextElementIndex];
    const nextImageElement = this.imageElements[nextElementIndex];
    const nextBackgroundElement = this.backgroundElements[nextElementIndex];
    const nextTitleElement = this.titleElements[nextElementIndex];
    this.currentElementIndex = nextElementIndex;

    this.fetchMetadata(filename).then((metadata) => {
      nextBackgroundElement.src = nextImageElement.src = `image/${filename}`;
      nextTitleElement.innerText = metadata?.title || filename;

      setTimeout(() => {
        // After a short delay to allow for load, fade in the new image and fade
        // out the old image.
        currentSlideElement.classList.remove("visible");
        currentBackgroundElement.classList.remove("visible");
        nextSlideElement.classList.add("visible");
        nextBackgroundElement.classList.add("visible");

        setTimeout(() => {
          if (this.currentImageIndex >= this.imageList.length - 1) {
            this.fetchImageList();
          } else {
            this.showNextImage();
          }
        }, 10000);
      }, 500);
    });
  }

  private fetchMetadata(filename: string): Promise<{ title: string } | null> {
    return fetch(`image/${filename}.json`)
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.json();
      })
      .catch(console.error);
  }
}

(window as unknown as { slideshow: TitledSlideshow }).slideshow =
  new TitledSlideshow();
