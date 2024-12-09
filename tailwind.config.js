module.exports = {
  content: [
    "./popup/**/*.{html,js}",
    "./background/**/*.js"
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [{
      light: {
        ...require("daisyui/src/theming/themes")["light"],
        "primary": "#7EBFB3",
        "accent": "#FF8B7E",
        "base-100": "#FFF8F0",
        "base-200": "#B8A7C9",
        "base-300": "#FFE4E1",
        "neutral": "#2D2D2D"
      }
    }],
  }
}