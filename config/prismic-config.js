module.exports = {
  apiEndpoint: 'https://your-repo-name.cdn.prismic.io/api/v2',
 

//-- Access token if the Master is not open
 accessToken: '',
 clientId: '',
 clientSecret: '',

// -- Links resolution rules
// This function will be used to generate links to Prismic.io documents
// As your project grows, you should update this function according to your routes

  linkResolver: function(doc) {
    if (doc.type == 'page') {
      return `/${doc.lang}/${doc.uid}`;
    } else {
      return `/${doc.lang}`;
    }
  }
}