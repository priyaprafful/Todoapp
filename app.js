"use strict";
// Module dependencies.
const prismic = require("prismic-javascript");
const prismicDom = require("prismic-dom");
const app = require("./config/config");
const prismicConfig = require("./config/prismic-config");
const siteConfig =  require("./config/site-config")
const port = app.get("port");
const asyncHandler = require ("./utils/async-handler");
const colorModeHandler = require ("./utils/color-mode-handler");


// Listen to application port.
app.listen(port, () => {
  process.stdout.write(`Point your browser to: http://localhost:${port}\n`);
});

// Root path router.
app.get("/", (req, res) => {
  res.redirect(siteConfig.defaultLanguage);
});

// Middleware to inject prismic context
app.get("*", asyncHandler (async (req, res,next) => {
  const api = await prismic.api (
    prismicConfig.apiEndpoint, { accessToken: prismicConfig.accessToken, req: req }
  )
  if (api) { 
    req.prismic = { api };
  } else {
    res.status(404).render ("./error_handlers/404");
  }
  next();
}));

// Preconfigured prismic preview
app.get('/preview', asyncHandler ( async (req, res) => {
  const token = req.query.token;
  if (token) {
    const url = await req.prismic.api.previewSession(token, prismicConfig.linkResolver, '/');
    res.redirect(302, url);
  } else {
    res.send(400, 'Missing token from querystring');
  }
}));

// Change mode router for setting or changing cookie mode.
app.get("/change-mode",  (req, res) => {
  colorModeHandler.setColor (req, res);
});

//Router for menu.
app.use("/:lang", asyncHandler (async (req, res, next) => {
  const lang = req.params.lang;
  let colorMode = colorModeHandler.getOrSetColor(req, res);
  
 // Start -- set locals param in res, to be used in multiple templates
  res.locals.ctx = {
    apiEndpoint: prismicConfig.apiEndpoint,
    linkResolver: prismicConfig.linkResolver,
    colorMode: colorMode,
    prismicDom: prismicDom,
  };
 // End -- set locals param in res, to be used in multiple templates
 
  const menuContent = await req.prismic.api.getSingle ("menu", { lang });
  res.locals.menuContent = menuContent;
  next();
}));

// Router for homepage.
app.get("/:lang/", asyncHandler (async (req, res) => {
  const lang = req.params.lang;
  const prismicResponse = await req.prismic.api.getSingle("homepage", { lang });
  if (prismicResponse) {
    res.render("page", { prismicResponse });
  } else {
    res.status(404).render("./error_handlers/404");
  }
}));
  
// Router for page.
app.get("/:lang/:uid", asyncHandler (async (req, res) => {
  const lang = req.params.lang;
  const uid = req.params.uid;
  const prismicResponse = await req.prismic.api.getByUID("page", uid, { lang })
  if (prismicResponse) { 
    res.render("page", { prismicResponse });
  } else {
    res.status(404).render("./error_handlers/404");
  }
}));

// Router handling for un-reachable pages.
app.get("/:lang/:uid/*",  (req, res) => {
  res.status(404).render("./error_handlers/404");
});

module.exports = app;