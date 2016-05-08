/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function checkPermission(type,result){
  // Check if we have permission to ask or answer
  // a question, using user defined functions from init options
  var method = this["permissionTo"+type];
  if(typeof method != "function"){return true;}
  if(method(
    this.model.modelName,
    this.method,
    this.search,
    this.req,
    result
  )){return true;}
  this.responder("Forbidden",false,403);
};
