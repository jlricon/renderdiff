const purgecss = require("@fullhuman/postcss-purgecss")({
  // Specify the paths to all of the template files in your project
  content: ["./pages/**/*.tsx", "./components/**/*.tsx", "./pages/**/*.js"],

  // make sure css reset isnt removed on html and body
  whitelist: ["html", "body"],
  whitelistPatterns: [/^rc-slider/],

  // Include any special characters you're using in this regular expression
  defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
});

module.exports = {
  plugins: [
    require("tailwindcss"),
    require("postcss-preset-env"),
    require("autoprefixer"),
    ...(process.env.NODE_ENV === "production" ? [purgecss] : []),
  ],
};
// module.exports = {
//   plugins: ["tailwindcss", "postcss-preset-env"]
// };
