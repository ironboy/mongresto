/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function init(app,options,m){
  var mongresto = this;
  console.log("Mongresto: Initializing!");
  // Use defaults if no option is set
  options = Object.assign(this.defaults, options);
  Object.assign(this,options);
  // Handle cache headers for requests
  this.cacheHeaders(app);
  // Connect to DB and load mongoose models
  this.connectToDb();
  this.loadMongooseModels();
   // A url path that will respond with clientside js
  app.get(this.clientsideJsPath + '/*', function (req, res) {
    mongresto.buildNgResourcesScript(req,res);
  });
  app.get(this.clientsideJsPath, function (req, res) {
    mongresto.buildNgResourcesScript(req,res);
  });
  // For legacy reasons - if the clientsideJsPath is factory default
  // then set up the old factory default as well
  if(this.clientsideJsPath == "/api/clientsidejs"){
    app.get('/api/ngresources/*', function (req, res) {
      mongresto.buildNgResourcesScript(req,res);
    });
    app.get('/api/ngresources', function (req, res) {
      mongresto.buildNgResourcesScript(req,res);
    });
  }
  // Setup any custom routes
  var me = this;
  this.customRoutes.forEach(function(route) {
    app[route.method](me.apiPath + '/' + route.path, route.controller(me.mongoose));
  });
   // Send all api request to apiCall
  app.all(this.apiPath + '/*', function (req, res) {
    mongresto.apiCall(req,res);
  });
   // Set up static folder
  if(m && options.staticFolder){
    options.staticFolder = m.path.normalize(
      m.approotpath + '/' + options.staticFolder
    );
    app.use(m.express.static(options.staticFolder));
    if(options.angularRoot){
      app.get('*', function (req, res) {
        res.sendFile(options.angularRoot, {root: options.staticFolder});
      });
    }
  }
 };
