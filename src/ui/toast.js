/**
 * /src/ui/toast.js
 * Toast notification system for instant visual cues during live simulation.
 */

export class ToastManager {
  constructor(containerId = 'toast-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = containerId;
      document.body.appendChild(this.container);
    }
  }

  show({ title, message, type = 'info', duration = 4000 }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      error: '⚠️',
      warning: '⚡',
      info: 'ℹ️',
      success: '✓'
    };

    toast.innerHTML = `
      <div style="font-size: 1.1rem; line-height: 1;">${iconMap[type] || 'ℹ️'}</div>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  error(title, message) {
    this.show({ title, message, type: 'error', duration: 5500 });
  }

  warning(title, message) {
    this.show({ title, message, type: 'warning', duration: 4500 });
  }

  info(title, message) {
    this.show({ title, message, type: 'info', duration: 3500 });
  }
}

export const toast = new ToastManager();
