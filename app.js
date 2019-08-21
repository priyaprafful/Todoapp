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

// Middleware to inject prismic context
app.use('/:lang',(req, res, next) => {
  const lang = req.params.lang
res.locals.ctx = {
    endpoint: PrismicConfig.apiEndpoint,
    linkResolver: PrismicConfig.linkResolver
  };


  res.locals.PrismicDOM = PrismicDOM;
  Prismic.api(PrismicConfig.apiEndpoint,{ accessToken: PrismicConfig.accessToken, req: req })
  .then((api) => {
    req.prismic = { api };
    req.prismic.api.getSingle('menu',getLanguageJson(lang ) )
    .then((menuContent)=>{
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
  req.prismic.api.getSingle("homepage", getLanguageJson(lang))
  .then((homepage_response) => {
    console.log("Homepage response is", JSON.stringify(homepage_response,null,10) )
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
  req.prismic.api.getByUID("aboutus",uid,getLanguageJson(lang))
  .then((aboutusContent) => {
    console.log("aboutus Content is ", JSON.stringify(aboutusContent,null,10) )
      res.render('aboutuspage', { aboutusContent });
      next();
  }).catch(function(err) {
    errorHandler(err, res);
  });
});



app.get('/:lang/preview', (req, res) => {
    const token = req.query.token;
    if (token) {
      req.prismic.api.previewSession(token, PrismicConfig.linkResolver, '/')
      .then((url) => {
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

