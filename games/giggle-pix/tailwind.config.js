/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './{components,services,utils}/**/*.{ts,tsx}'],
  "theme": {
    "extend": {
      "fontFamily": {
        "sans": [
          "Comic Sans MS",
          "Chalkboard SE",
          "sans-serif"
        ]
      },
      "colors": {
        "kid-yellow": "#FFD93D",
        "kid-blue": "#6BCB77",
        "kid-pink": "#FF6B6B",
        "kid-purple": "#9D4EDD"
      },
      "boxShadow": {
        "comic": "4px 4px 0px 0px rgba(0,0,0,1)",
        "comic-hover": "2px 2px 0px 0px rgba(0,0,0,1)"
      }
    }
  }
};
