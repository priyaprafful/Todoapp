module.exports = {

    apiEndpoint: 'https://todo-app-sample.cdn.prismic.io/api/v2',
  
    // -- Access token if the Master is not open
    // accessToken: 'xxxxxx',
  
    // OAuth
    // clientId: 'xxxxxx',
    // clientSecret: 'xxxxxx',
    
    
    // -- Links resolution rules
    // This function will be used to generate links to Prismic.io documents
    // As your project grows, you should update this function according to your routes
    linkResolver: function (doc) {
    
      if (doc.isBroken) {
       return '/404'
      }
      if (doc.type == 'homepage') {
         
        return `/${doc.lang}`
      }
      if (doc.type == 'page') {
         
         return `/${doc.lang}/${doc.uid}`
      }
     else{
        return `/404`
      }
    }
  }

  