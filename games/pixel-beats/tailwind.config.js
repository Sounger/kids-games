/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './{components,services,utils}/**/*.{ts,tsx}'],
  // PixelBeats builds colour classes at runtime (bg-${color}), so keep them all.
  safelist: [{ pattern: /^bg-(blue|cyan|green|yellow|orange|pink|purple|red)-(300|400|500|600)$/ }],
  
};
