/*
  mongresto 0.3.81

  May 2016 Nodebite AB, Thomas Frank

  MIT Licensed - use anywhere you want!

  A mongodb REST service for Node.js Express + mongoose
  working with mongoose models
  + generating Angular resource objects on the fly
*/


/*
  Nodebite code style -> jshint settings below, also 
  indent = 2 spaces, keep your rows reasonably short
  also your methods below sceen height.
*/
/* jshint 
  loopfunc: true,
  trailing: true,
  sub: true,
  expr: true,
  noarg: false,
  forin: false
*/

var mongresto = (function(){ return {

  load:function(){
    var path = __dirname + '/mongresto-modules/', m;
    require('fs').readdirSync(path).forEach(function(x){
      m = require(path + x);
      this[m.name] = m;
    },this);
  }

};})();

// Start up
function pub(options){
  var m = {};
  [
    "path", "express", "body-parser", "app-root-path", "compression"
  ].forEach(function(x){ m[x.replace(/\W/g,'')] = require(x); });
  mongresto.load();
  var app = m.express();
  app.use(m.compression());
  app.use(m.bodyparser.json());
  app.use(m.bodyparser.urlencoded({ extended: false }));
  mongresto.init(app,options,m);
  return app;
}

// The old init method (deprecated but supported for a while)
pub.init = function(app,options){
  mongresto.load();
  return mongresto.init.apply(mongresto,[app,options]);
};

module.exports = pub;
