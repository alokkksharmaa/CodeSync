/**
 * Generate a random username
 */
export function generateUsername() {
  const adjectives = ['Swift', 'Clever', 'Bright', 'Quick', 'Smart', 'Bold', 'Keen'];
  const nouns = ['Coder', 'Dev', 'Hacker', 'Builder', 'Ninja', 'Wizard', 'Guru'];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 100);

  return `${adj}${noun}${num}`;
}

/**
 * Generate a random vibrant color for user cursor
 */
export function generateUserColor() {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Sky Blue
    '#F8B739', // Gold
    '#52B788', // Green
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Throttle function - limits how often a function can be called
 */
export function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}
