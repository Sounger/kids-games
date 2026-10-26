/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './{components,services,utils}/**/*.{ts,tsx}'],
  "theme": {
    "extend": {
      "fontFamily": {
        "sans": [
          "Inter",
          "sans-serif"
        ],
        "pixel": [
          "\"VT323\"",
          "monospace"
        ]
      },
      "colors": {
        "retro-yellow": "#FACC15",
        "retro-blue": "#60A5FA",
        "retro-green": "#4ADE80",
        "retro-gray": "#D1D5DB",
        "retro-dark": "#1F2937"
      },
      "boxShadow": {
        "retro": "4px 4px 0px 0px rgba(0,0,0,1)",
        "retro-sm": "2px 2px 0px 0px rgba(0,0,0,1)",
        "retro-none": "0px 0px 0px 0px rgba(0,0,0,1)"
      },
      "keyframes": {
        "shake": {
          "0%, 100%": {
            "transform": "translateX(0)"
          },
          "10%, 30%, 50%, 70%, 90%": {
            "transform": "translateX(-4px)"
          },
          "20%, 40%, 60%, 80%": {
            "transform": "translateX(4px)"
          }
        }
      },
      "animation": {
        "shake": "shake 0.5s cubic-bezier(.36,.07,.19,.97) both"
      }
    }
  }
};
