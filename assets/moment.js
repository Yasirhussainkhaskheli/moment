(() => {
  const galleries = document.querySelectorAll('[data-hover-gallery]');

  galleries.forEach((gallery) => {
    const images = Array.from(gallery.querySelectorAll('.moment-featured__image'));

    if (images.length < 2) return;

    const intervalMs = Number(gallery.dataset.galleryInterval || 850);
    let activeIndex = 0;
    let timerId = null;

    const showImage = (nextIndex) => {
      images.forEach((image, index) => {
        image.classList.toggle('is-active', index === nextIndex);
      });
      activeIndex = nextIndex;
    };

    const stopSlideshow = () => {
      if (timerId) {
        window.clearInterval(timerId);
        timerId = null;
      }
      showImage(0);
    };

    const startSlideshow = () => {
      if (timerId) return;

      timerId = window.setInterval(() => {
        const nextIndex = (activeIndex + 1) % images.length;
        showImage(nextIndex);
      }, intervalMs);
    };

    gallery.addEventListener('mouseenter', startSlideshow);
    gallery.addEventListener('mouseleave', stopSlideshow);
    gallery.addEventListener('focusin', startSlideshow);
    gallery.addEventListener('focusout', (event) => {
      if (!gallery.contains(event.relatedTarget)) {
        stopSlideshow();
      }
    });
  });
})();
