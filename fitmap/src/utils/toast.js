// src/utils/toast.js
/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast: 'info', 'success', 'warning', or 'error'
 * @param {number} duration - Duration in milliseconds
 */
export const showToast = (message, type = 'info', duration = 3000) => {
  // Create toast element
  const toast = document.createElement('div');
  
  // Add styles
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.zIndex = '9999';
  toast.style.minWidth = '250px';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = 'bold';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.justifyContent = 'center';
  toast.style.direction = 'rtl';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s, transform 0.3s';
  
  // Set styles based on type
  switch (type) {
    case 'success':
      toast.style.backgroundColor = '#4caf50';
      toast.style.color = 'white';
      toast.innerHTML = `✓ ${message}`;
      break;
    case 'warning':
      toast.style.backgroundColor = '#ff9800';
      toast.style.color = 'white';
      toast.innerHTML = `⚠️ ${message}`;
      break;
    case 'error':
      toast.style.backgroundColor = '#f44336';
      toast.style.color = 'white';
      toast.innerHTML = `❌ ${message}`;
      break;
    default: // info
      toast.style.backgroundColor = '#2196f3';
      toast.style.color = 'white';
      toast.innerHTML = `ℹ️ ${message}`;
  }
  
  // Add to document
  document.body.appendChild(toast);
  
  // Fade in
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);
  
  // Fade out and remove
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
};