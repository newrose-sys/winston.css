/**
 * Lightbox Component for winston.css
 * A modal lightbox that slides down from the top of the viewport
 */
class Lightbox {
  constructor(element) {
    if (typeof element === 'string') {
      this.element = document.querySelector(element);
    } else {
      this.element = element;
    }

    if (!this.element) {
      console.error('Lightbox: Element not found');
      return;
    }

    this.backdrop = null;
    this.closeButton = null;
    this.isOpen = false;
    this.originalBodyOverflow = '';

    this._init();
  }

  _init() {
    // Add lightbox class if not present
    if (!this.element.classList.contains('lightbox')) {
      this.element.classList.add('lightbox');
    }

    // Create and add close button if not present
    if (!this.element.querySelector('.lightbox-close')) {
      this.closeButton = document.createElement('span');
      this.closeButton.className = 'lightbox-close';
      this.closeButton.setAttribute('role', 'button');
      this.closeButton.setAttribute('aria-label', 'Close lightbox');
      this.closeButton.setAttribute('tabindex', '0');
      this.element.insertBefore(this.closeButton, this.element.firstChild);
    } else {
      this.closeButton = this.element.querySelector('.lightbox-close');
    }

    // Set initial state
    this.element.setAttribute('aria-hidden', 'true');
    this.element.style.display = 'none';

    // Bind event handlers
    this._handleEscKey = this._handleEscKey.bind(this);
    this._handleBackdropClick = this._handleBackdropClick.bind(this);
    this._handleCloseClick = this._handleCloseClick.bind(this);
    this._handleCloseKeydown = this._handleCloseKeydown.bind(this);

    // Add close button listeners
    this.closeButton.addEventListener('click', this._handleCloseClick);
    this.closeButton.addEventListener('keydown', this._handleCloseKeydown);
  }

  open() {
    if (this.isOpen) return;

    this.isOpen = true;

    // Create backdrop
    this._createBackdrop();

    // Prevent body scroll
    this.originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Show lightbox
    this.element.style.display = 'block';
    this.element.setAttribute('aria-hidden', 'false');

    // Force reflow to enable transition
    this.element.offsetHeight;

    // Add open class for animation
    this.element.classList.add('is-open');
    if (this.backdrop) {
      this.backdrop.classList.add('is-visible');
    }

    // Add event listeners
    document.addEventListener('keydown', this._handleEscKey);
    if (this.backdrop) {
      this.backdrop.addEventListener('click', this._handleBackdropClick);
    }

    // Emit custom event
    this.element.dispatchEvent(new CustomEvent('lightbox:open', { bubbles: true }));
  }

  close() {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Remove open class for animation
    this.element.classList.remove('is-open');
    if (this.backdrop) {
      this.backdrop.classList.remove('is-visible');
    }

    // Wait for animation to complete
    const transitionDuration = parseFloat(getComputedStyle(this.element).transitionDuration) * 1000 || 200;

    setTimeout(() => {
      // Hide lightbox
      this.element.style.display = 'none';
      this.element.setAttribute('aria-hidden', 'true');

      // Remove backdrop
      this._removeBackdrop();

      // Restore body scroll
      document.body.style.overflow = this.originalBodyOverflow;

      // Remove event listeners
      document.removeEventListener('keydown', this._handleEscKey);
    }, transitionDuration);

    // Emit custom event
    this.element.dispatchEvent(new CustomEvent('lightbox:close', { bubbles: true }));
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  _createBackdrop() {
    if (this.backdrop) return;

    this.backdrop = document.createElement('div');
    this.backdrop.className = 'lightbox-backdrop';
    this.backdrop.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.backdrop);
  }

  _removeBackdrop() {
    if (this.backdrop) {
      this.backdrop.removeEventListener('click', this._handleBackdropClick);
      this.backdrop.remove();
      this.backdrop = null;
    }
  }

  _handleEscKey(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      this.close();
    }
  }

  _handleBackdropClick(event) {
    if (event.target === this.backdrop) {
      this.close();
    }
  }

  _handleCloseClick() {
    this.close();
  }

  _handleCloseKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.close();
    }
  }

  destroy() {
    this.close();
    this.closeButton.removeEventListener('click', this._handleCloseClick);
    this.closeButton.removeEventListener('keydown', this._handleCloseKeydown);
    if (this.closeButton.parentNode === this.element) {
      this.closeButton.remove();
    }
    this.element.classList.remove('lightbox');
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Lightbox;
}
