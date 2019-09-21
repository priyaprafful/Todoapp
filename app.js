"use strict";

/**
 * Module dependencies.
 */
const Prismic = require('prismic-javascript');
const PrismicDOM = require('prismic-dom');
const app = require('./config');
const PrismicConfig = require('./prismic-configuration');
const PORT = app.get('port');

function render404(res) {
  res.status(404);
  res.render('404');
}

app.listen(PORT, () => {
  process.stdout.write(`Point your browser to: http://localhost:${PORT}\n`);
  
});

//var changeMode = function (req,res) {
app.use('/changeMode',(req, res, next) => {
  console.log('4. ***********mode cookie is changed to light mode unsuccessfully', req.headers.referer);
  let colorMode = req.cookies.mode;
  // if not make it

    if(colorMode=='light-mode'){
      res.cookie('mode', 'dark-mode',{ maxAge: 900000, httpOnly: true });
      //console.log('mode cookie is changed to light mode successfully');
    } else {
      res.cookie('mode', 'light-mode',{ maxAge: 900000, httpOnly: true });
      //console.log('mode cookie is changed to dark mode successfully');
    }
  
  res.redirect(req.headers.referer) ;
})

// Middleware to inject prismic context
app.use('/:lang',(req, res, next) => {
  let colorMode = req.cookies.mode;
  //console.log("************** request cookies are ****** ",colorMode);
  if (!colorMode) {
    res.cookie('mode', 'light-mode',{ maxAge: 900000, httpOnly: true });
    colorMode = 'light-mode';
    //console.log(" 0. cookie did not exist, but now set");
  } //else
  //console.log("**************  2. request cookies are ****** ",colorMode);
  
  const lang = req.params.lang
  
  res.locals.ctx = {
  endpoint: PrismicConfig.apiEndpoint,
  linkResolver: PrismicConfig.linkResolver

  };
  //res.locals.changeMode = changeMode;
  res.locals.mode = colorMode;

 res.locals.PrismicDOM = PrismicDOM;
  Prismic.api(PrismicConfig.apiEndpoint,{ accessToken: PrismicConfig.accessToken, req: req }).then((api) => {
    //console.log(JSON.stringify(api.data.refs,null,10))
    req.prismic = { api };
    req.prismic.api.getSingle('menu',getLanguageJson(lang ) ).then((menuContent)=>{
      //console.log("menucontent is", JSON.stringify(menuContent,null,10))
      res.locals.allmenuContent = menuContent;
      next();
    }).catch(function(err) {
      errorHandler(err, res);
    });
  });
})

const defaultLanguage  = 'en-gb';

function getLanguageJson(language) {
  return {lang: language};
}
app.get('/', (req, res, next) => {
  res.redirect(defaultLanguage);
});

// Route for the homepage
app.get('/:lang/', (req, res, next) => {
  const lang = req.params.lang
  req.prismic.api.getSingle("homepage", getLanguageJson(lang)).then((homepage_response) => {
    //console.log("Homepage response is", JSON.stringify(homepage_response,null,10) )
    res.render('homepage', { homepage_response });
    next();
  }).catch(function(err) {
    errorHandler(err, res);
  });
});

//route for aboutus page
app.get('/:lang/:uid',(req, res, next) => {
  const uid = req.params.uid;
  const lang = req.params.lang
  req.prismic.api.getByUID("page",uid,getLanguageJson(lang)).then((aboutusContent) => {
    //console.log("aboutus Content is ", JSON.stringify(aboutusContent,null,10) )
    res.render('aboutuspage', { aboutusContent });
    next();
  }).catch(function(err) {
    errorHandler(err, res);
  });
});

app.get('/preview', (req, res) => {
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

function errorHandler(err, res, err_status){  
  if(err==null){
    render404(res);
  }
  else if (err.status == 404) {
    res.status(404).send('There was a problem connecting to your API, please check your configuration file for errors.');
  } else {
    res.status(500).send('Error 500: ' + err.message);
  }
}
