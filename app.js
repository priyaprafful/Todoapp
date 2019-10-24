"use strict";
/**
 * Module dependencies.
 */
const Prismic = require('prismic-javascript');
const PrismicDOM = require('prismic-dom');
const app = require('./config');
const PrismicConfig = require('./prismic-configuration');
const PORT = app.get('port');

/**Lanaguage and image folder root pathconstant. */
const DEFAULT_LANGUAGE  = 'en-gb';
const IMAGE_ROOT_FOLDER ='/images';

/** COOKIE CONSTANTS. */
const LIGHT_COLOR_MODE = 'light-mode';
const DARK_COLOR_MODE = 'dark-mode';
const COLOR_MODE_COOKIE_NAME = 'mode';
const COLOR_MODE_COOKIE_AGE = 900000;
const COLOR_MODE_COOKIE_HTTP_FLAG = true;

/** ERROR Handling CONSTANTS. */
const PRISMIC_ERROR_PAGE_RENDER_NAME = 'error';
const ERROR_PAGE_404_RENDER_NAME = '404';

/** Prismic Custom TYPE CONSTANTS. */
const CUSTUM_TYPE_MENU = 'menu';
const CUSTOM_TYPE_HOMEPAGE = 'homepage';
const CUSTOM_TYPE_PAGE = 'page';

/** RENDERING PAGE CONTANTS */
const HOME_PAGE = 'homepage';
const ABOUT_US_PAGE = 'aboutuspage';

/**
 * Objective of this function is ton get the json from lanaguage passed. 
 * @param {String} language 
 */
function getLanguageJson(language) {
  return {lang: language};
}

function setColorModeCookie(res, cookieValue) {
  res.cookie(COLOR_MODE_COOKIE_NAME, cookieValue,{ maxAge: COLOR_MODE_COOKIE_AGE, httpOnly: COLOR_MODE_COOKIE_HTTP_FLAG });
}

/**
 * Objective of this function is to listen to application port.
 */
app.listen(PORT, () => {
  process.stdout.write(`Point your browser to: http://localhost:${PORT}\n`);  
});

/**
 * Root path router.
 */
app.get('/', (req, res, next) => {
  res.redirect(DEFAULT_LANGUAGE);
});
/**
 *  Preview router for preview mode used from Prismic.
 */
app.get('/preview', (req, res) => {
  Prismic.api(PrismicConfig.apiEndpoint,{ accessToken: PrismicConfig.accessToken, req: req }).then((api) => {
    req.prismic = { api };
    const token = req.query.token;
    if (token) {
      req.prismic.api.previewSession(token, PrismicConfig.linkResolver, '/').then((url) => {
        res.redirect(302, url);
      }).catch((err) => {
      res.status(500).send(`Error 500 in preview: ${err.message}`);
      });
    } else {
      res.send(400, 'Missing token from querystring');
    }
  });
});

/**
 * Change mode router for setting or changing cookie mode.
 */
app.use('/changeMode',(req, res, next) => {
  let colorMode = req.cookies.mode;
  //change the color mode cookie, default value is light mode.
  if (colorMode==LIGHT_COLOR_MODE)
    setColorModeCookie(res, DARK_COLOR_MODE);
  else 
    setColorModeCookie(res, LIGHT_COLOR_MODE);

  if(req.headers.referer)
    res.redirect(req.headers.referer);
  else
    res.redirect('/');
})

/**
 * Middleware to inject prismic context. 
 */
app.use('/:lang',(req, res, next) => {
  let colorMode = req.cookies.mode;
  //set the color mode cookie if not defined, default value is light color mode
  if (!colorMode) {
    setColorModeCookie(res, LIGHT_COLOR_MODE);
    colorMode = LIGHT_COLOR_MODE;
  }
  //start -- set locals param in res, to be used in multiple templates
  //language from parameter, set in locals
  const lang = req.params.lang;
  res.locals.ctx = {
    endpoint: PrismicConfig.apiEndpoint,
    linkResolver: PrismicConfig.linkResolver
  };
  //color mode set in locals, used in layout.pug
  res.locals.mode = colorMode;
  res.locals.PrismicDOM = PrismicDOM;
  res.locals.imageRootFolder = IMAGE_ROOT_FOLDER;
  //end -- set locals param in res, to be used in multiple templates
  
  Prismic.api(PrismicConfig.apiEndpoint,{ accessToken: PrismicConfig.accessToken}).then((api) => {
    req.prismic = { api };
    req.prismic.api.getSingle(CUSTUM_TYPE_MENU,getLanguageJson(lang)).then((menuContent)=>{
      res.locals.allmenuContent = menuContent;
      next();
    }).catch((err)=> {
      res.status(404).render(ERROR_PAGE_404_RENDER_NAME);
    });
  }).catch((err)=> {
    res.render(PRISMIC_ERROR_PAGE_RENDER_NAME);
  });
})

/**
 * Router for Home page.
 */
app.get('/:lang/', (req, res, next) => {
  const lang = req.params.lang;
  req.prismic.api.getSingle(CUSTOM_TYPE_HOMEPAGE, getLanguageJson(lang)).then((prismicResponse) => {
    if(prismicResponse){
      res.render(HOME_PAGE, {prismicResponse});
      next();
    } else{
      res.status(404).render(ERROR_PAGE_404_RENDER_NAME);
    }
  }).catch((err)=> {
    res.status(404).render(ERROR_PAGE_404_RENDER_NAME);
  });
});

/**
 * Router for About us page.
 */
app.get('/:lang/:uid',(req, res, next) => {
  const uid = req.params.uid;
  const lang = req.params.lang;
  req.prismic.api.getByUID(CUSTOM_TYPE_PAGE,uid,getLanguageJson(lang)).then((prismicResponse) => {
    if(prismicResponse){
      res.render(ABOUT_US_PAGE, {prismicResponse});
      next();
    } else{
      res.status(404).render(ERROR_PAGE_404_RENDER_NAME);
    }
  }).catch((err)=> {
    res.status(404).render(ERROR_PAGE_404_RENDER_NAME);
  });
});

/**
 * Router handling for un-reachable pages.
 */
app.get('/:lang/:uid/*$',(req, res, next) => {
  res.status(404).render(ERROR_PAGE_404_RENDER_NAME);
});