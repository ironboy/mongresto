/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function responder(error,result,errorCode){
  // Respond to CRUD calls
  var singleton = !this.forceArray && this.req.method == "GET" && this.search._id;
  this.res.status(error ? errorCode || 500 : 200);
  result = (singleton && result && result[0]) || (!singleton && result);
  if(!this.checkPermission("Answer",result)){return;}
  this.res.json((error && {_error:error}) || result);
};
