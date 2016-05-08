/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function apiCallHandler(req,res){
  // Save the req and res objects + http method
  this.req = req;
  this.res = res;
  this.method = req.method;
  
  // Get the search object and mongoose model from the url
  var url = this.splitUrl(req.url);
  this.search = this.createSearchObject(url[1]);
  this.model = this.mongooseModels[url[0].toLowerCase()];
  if(!this.model){
    this.responder("No model named " + url[0] + "!");
    return;
  }
   // Handle special control directives hiding as properties
  this.handleControlDirectives();
   // Sweetener for a search through all string props
  this.searchAllStringProps(this.search._all);
   // Run query
  this.runQuery();
};
