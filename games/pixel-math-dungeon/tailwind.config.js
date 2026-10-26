/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './{components,services,utils}/**/*.{ts,tsx}'],
  "theme": {
    "extend": {
      "fontFamily": {
        "pixel": [
          "\"VT323\"",
          "monospace"
        ]
      },
      "colors": {
        "pixel-bg": "#2d1b2e",
        "pixel-card": "#b45252",
        "pixel-accent": "#d3a068",
        "pixel-green": "#4b692f",
        "pixel-blue": "#323c39"
      },
      "animation": {
        "bounce-slow": "bounce 3s infinite",
        "float": "float 3s ease-in-out infinite"
      },
      "keyframes": {
        "float": {
          "0%, 100%": {
            "transform": "translateY(0)"
          },
          "50%": {
            "transform": "translateY(-10px)"
          }
        }
      }
    }
  }
};
