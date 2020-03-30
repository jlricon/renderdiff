const withCss = require("@zeit/next-css");
module.exports = withCss({
  devIndicators: {
    autoPrerender: false
  }
});
