// This script is injected into the page when a suspicious domain is detected.
// It can be used to highlight elements or add custom styles.

console.log('DiGuard: Content script injected.');

// Add a custom style to dim the background while showing the warning
const style = document.createElement('style');
style.innerHTML = `
  body {
    filter: brightness(0.7);
    pointer-events: none;
    user-select: none;
  }
`;
document.head.appendChild(style);

// Optionally, display a message on the page
const messageDiv = document.createElement('div');
messageDiv.style.position = 'fixed';
messageDiv.style.top = '50%';
messageDiv.style.left = '50%';
messageDiv.style.transform = 'translate(-50%, -50%)';
messageDiv.style.backgroundColor = 'white';
messageDiv.style.padding = '20px';
messageDiv.style.borderRadius = '10px';
messageDiv.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
messageDiv.style.zIndex = '9999';
messageDiv.textContent = 'Please wait... checking domain safety.';
document.body.appendChild(messageDiv);