module.exports = {
  lightColorMode : "light-mode",
  darkColorMode : "dark-mode",
  setCookie : function (res, cookieValue) {
    res.cookie (
      "colorMode",
       cookieValue, {
       maxAge: 900000,
         httpOnly: true
      }
    );
  },

  getOrSetColor : function (req, res) {
    let colorMode = req.cookies.colorMode;
    if (!colorMode) {
      this.setCookie (res, this.lightColorMode);
      colorMode = this.lightColorMode;
    }
    return colorMode;
  },

  setColor : function (req, res) {
   let colorMode = req.cookies.colorMode;
    // Set the color mode cookie if not defined, default value is light color mode
    if (!colorMode || (colorMode == this.darkColorMode)) {
      this.setCookie(res, this.lightColorMode)
      colorMode = this.lightColorMode;
    } else {
      this.setCookie(res, this.darkColorMode)
      colorMode = this.darkColorMode;
    } 
    if (req.headers.referer) {
      res.redirect(req.headers.referer);
    } else {
      res.redirect('/');
    }
  }
}