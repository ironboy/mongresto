module.exports = {

  // The MongoDB database to connect to
  dbName: "test",

  // The path to the rest api
  apiPath: "/api",

  // If mongresto should control cache headers
  // (never allowing a 304 status on a rest api call)
  controlCacheHeaders: true,

  // A path to a static folder
  staticFolder: "./www",

  // The root file of the Angular app
  // (use for all urls in staticFolder that doesn't 
  //  resolve to a filename)
  angularRoot: "index.html",
  
  // The path where you should put your Mongoose models
  modelPath: "./mongoose-models/",
  
  // The path where Mongresto will autogenerate
  // frontend JavaScript containing ngResource-based objects
  clientsideJsPath: "/api/clientsidejs",
  
  // If Angular.js should stop all further requests to the backend
  // if one result comes back as an error
  ngStopQueueOnError: false,
  
  // A function written by you - it gets access to the current question
  // and can deny Mongresto permission to run it
  permissionToAsk:
    function(modelName, method, query, req){ return true; },
  
  // A function written by you - it gets access to the current result
  // (and question) and can deny Mongresto permission to return it
  permissionToAnswer:
    function(modelName, method, query, req, result){ return true; },

  // Custom routes (see documentation)
  customRoutes: [
    // {path: "", controller:""}
  ],

  name: "defaults"
};
