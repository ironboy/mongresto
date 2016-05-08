/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function apiCall(req,res){
   // Important! Since Node.js is single-threaded
  // saving things in the this scope
  // and depending on them to be there 
  // before and after async db calls
  // is a recipe for disaster / mix-ups
  // of different questions (and users)
   // To avoid this we clone a new instance of the 
  // main object/the library and run from there.
  // (This is a nice alternative to sending around 
  //  a lot of parameters between methods - old school node)
  Object.create(this).apiCallHandler(req,res);
 };
