"use strict";
// Module dependencies.
const prismic = require("prismic-javascript");
const prismicDom = require("prismic-dom");
const app = require("./config");
const prismicConfig = require("./prismic-configuration");
const port = app.get("port");

// Lanaguage and image folder root pathconstant.
const defaultLanguage = "en-gb";
const imageRootFolder = "/images";

// Cookie Constants. 
const lightColorMode = "light-mode";
const darkColorMode = "dark-mode";
const colorModeCookieName = "mode";
const colorModeCookieAge = 900000;
const colorModeCookieHTTPFlag = true;

// Objective of this function is to get the json from language passed. 
function getLanguageJson(language) {
  return {
    lang: language
  };
}
// Setting color mode cookie.
function setColorModeCookie(res, cookieValue) {
  res.cookie(
    colorModeCookieName,
    cookieValue, {
      maxAge: colorModeCookieAge,
      httpOnly: colorModeCookieHTTPFlag
    }
  );
}

// Objective of this function is to listen to application port.
app.listen(port, () => {
  process.stdout.write(`Point your browser to: http://localhost:${port}\n`);
});

// Root path router.
app.get("/", (req, res) => {
  res.redirect(defaultLanguage);
});

// Preview router for preview mode used from Prismic.
app.get("/preview", (req, res) => {
  prismic.api(
    prismicConfig.apiEndpoint, {
      accessToken: prismicConfig.accessToken,
      req: req
    }
  ).then((api) => {
    req.prismic = {
      api
    };
    const token = req.query.token;
    if (token) {
      req.prismic.api.previewSession(
        token,
        prismicConfig.linkResolver,
        '/'
      ).then((url) => {
        res.redirect(302, url);
      }).catch((err) => {
        res.status(500).send(`Error 500 in preview: ${err.message}`);
      });
    } else {
      res.send(400, "Missing token from querystring");
    }
  });
});

// Change mode router for setting or changing cookie mode.
app.use("/change-mode", (req, res) => {
  let colorMode = req.cookies.mode;
  //change the color mode cookie, default value is light mode.
  if (colorMode == lightColorMode) {
    setColorModeCookie(res, darkColorMode);
  } else {
    setColorModeCookie(res, lightColorMode);
  }
  if (req.headers.referer) {
    res.redirect(req.headers.referer);
  } else {
    res.redirect('/');
  }
});

// Middleware to inject prismic context. 
app.use("/:lang", (req, res, next) => {
  var colorMode = req.cookies.mode;
  // Set the color mode cookie if not defined, default value is light color mode
  if (!colorMode) {
    setColorModeCookie(res, lightColorMode);
    colorMode = lightColorMode;
  }
  
  // Language from parameter
  const lang = req.params.lang;

 // Start -- set locals param in res, to be used in multiple templates
  res.locals.ctx = {
    endpoint: prismicConfig.apiEndpoint,
    linkResolver: prismicConfig.linkResolver,
    colorMode: colorMode,
    prismicDom: prismicDom,
    imageRootFolder: imageRootFolder,
  };
 // End -- set locals param in res, to be used in multiple templates

  prismic.api(
    prismicConfig.apiEndpoint
    // { 
    //   accessToken: prismicConfig.accessToken
    // }
  ).then((api) => {
    req.prismic = {
      api
    };
    req.prismic.api.getSingle("menu", getLanguageJson(lang)).then((menuContent) => {
      res.locals.menuContent = menuContent;
      next();
    }).catch(() => {
      res.status(404).render("./error_handlers/404");
    });
  }).catch(() => {
    res.render("./error_handlers/prismic-error");
  });
});

// Router for Homepage.
app.get("/:lang/", (req, res) => {
  const lang = req.params.lang;
  req.prismic.api.getSingle("homepage", getLanguageJson(lang)).then((prismicResponse) => {
    if (prismicResponse) {
      res.render("page", {
        prismicResponse
      });
    } else {
      res.status(404).render("./error_handlers/404");
    }
  }).catch(() => {
    res.status(404).render("./error_handlers/404");
  });
});

// Router for page.
app.get("/:lang/:uid", (req, res) => {
  const uid = req.params.uid;
  const lang = req.params.lang;
  req.prismic.api.getByUID("page", uid, getLanguageJson(lang)).then((prismicResponse) => {
    if (prismicResponse) {
      res.render("page", {
        prismicResponse
      });
    } else {
      res.status(404).render("./error_handlers/404");
    }
  }).catch(() => {
    res.status(404).render("./error_handlers/404");
  });
});

// Router handling for un-reachable pages.
app.get("/:lang/:uid/*", (req, res) => {
  res.status(404).render("./error_handlers/404");
});