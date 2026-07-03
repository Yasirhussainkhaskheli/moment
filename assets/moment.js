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
(() => {
  const initializedKey = 'momentSliderInitialized';

  const getVisibleSlides = () => {
    if (window.matchMedia('(max-width: 749px)').matches) return 1;
    if (window.matchMedia('(max-width: 989px)').matches) return 2;
    return 3;
  };

  const sliders = document.querySelectorAll('[data-moment-slider]');

  sliders.forEach((slider) => {
    if (slider.dataset[initializedKey] === 'true') return;
    slider.dataset[initializedKey] = 'true';

    const track = slider.querySelector('[data-slider-track]');
    if (!track) return;

    const originalSlides = Array.from(track.children);
    if (originalSlides.length === 0) return;

    const autoplaySpeed = Number(slider.dataset.autoplaySpeed || 3) * 1000;
    let visibleSlides = 3;
    let currentIndex = 0;
    let isAnimating = false;
    let autoplayId = null;
    let resizeTimeout = null;

    const clearAutoplay = () => {
      if (autoplayId) {
        window.clearInterval(autoplayId);
        autoplayId = null;
      }
    };

    const currentSlides = () => Array.from(track.children);

    const clearClones = () => {
      track.querySelectorAll('[data-clone="true"]').forEach((slide) => slide.remove());
    };

    const setSlideWidths = () => {
      track.style.setProperty('--moment-visible-slides', String(visibleSlides));
    };

    const updatePosition = (animate) => {
      const slides = currentSlides();
      const activeSlide = slides[currentIndex];
      if (!activeSlide) return;

      track.style.transition = animate ? 'transform 0.5s ease' : 'none';
      track.style.transform = `translate3d(-${activeSlide.offsetLeft}px, 0, 0)`;
    };

    const startAutoplay = () => {
      clearAutoplay();

      autoplayId = window.setInterval(() => {
        if (isAnimating) return;
        isAnimating = true;
        currentIndex += 1;
        updatePosition(true);
      }, autoplaySpeed);
    };

    const buildSlider = () => {
      clearAutoplay();
      clearClones();

      visibleSlides = Math.min(getVisibleSlides(), originalSlides.length);
      setSlideWidths();

      if (originalSlides.length <= visibleSlides) {
        slider.classList.add('is-static');
        currentIndex = 0;
        updatePosition(false);
        return;
      }

      slider.classList.remove('is-static');

      const leadingClones = originalSlides.slice(-visibleSlides).map((slide) => {
        const clone = slide.cloneNode(true);
        clone.dataset.clone = 'true';
        return clone;
      });

      const trailingClones = originalSlides.slice(0, visibleSlides).map((slide) => {
        const clone = slide.cloneNode(true);
        clone.dataset.clone = 'true';
        return clone;
      });

      leadingClones.forEach((clone) => track.insertBefore(clone, track.firstChild));
      trailingClones.forEach((clone) => track.appendChild(clone));

      currentIndex = visibleSlides;
      updatePosition(false);
      startAutoplay();
    };

    track.addEventListener('transitionend', () => {
      const totalOriginalSlides = originalSlides.length;

      if (totalOriginalSlides <= visibleSlides) {
        isAnimating = false;
        return;
      }

      if (currentIndex >= totalOriginalSlides + visibleSlides) {
        currentIndex = visibleSlides;
        updatePosition(false);
      } else if (currentIndex < visibleSlides) {
        currentIndex = totalOriginalSlides + visibleSlides - 1;
        updatePosition(false);
      }

      isAnimating = false;
    });

    const canHoverSlider = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (canHoverSlider) {
      slider.addEventListener('mouseenter', clearAutoplay);
      slider.addEventListener('mouseleave', startAutoplay);
      slider.addEventListener('focusin', clearAutoplay);
      slider.addEventListener('focusout', (event) => {
        if (!slider.contains(event.relatedTarget)) startAutoplay();
      });
    }

    window.addEventListener('resize', () => {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(buildSlider, 150);
    });

    buildSlider();
  });
})();
