/*
  mongresto 0.19

  June 2015 Nodebite AB, Thomas Frank

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


var mongresto = module.exports = (function _mongresto(){ return {

  defaults: {
 
    // The MongoDB database to connect to
    dbName: "test",

    // The path to the rest api
    apiPath: "/api",
    
    // The path where you should put your Mongoose models
    modelPath: "./mongoose-models/",
    
    // The path where Mongresto will autogenerate
    // frontend JavaScript containing ngResource-based objects
    ngResourcesPath: "/api/ngresources",
    
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

    customRoutes: [
      // {path: "", controller:""}
    ]
  },

  init: function(app,options){

    console.log("Mongresto: Initializing!");

    // Use defaults if no option is set
    options = options || {};
    for(var i in this.defaults){
      this[i] = options[i] || this.defaults[i];
    }

    // Connect to DB and load mongoose models
    this.connectToDb();
    this.loadMongooseModels();

    // A url path that will respond with ngresources
    app.get(this.ngResourcesPath + '/*', function (req, res) {
      mongresto.buildNgResourcesScript(req,res);
    });

    // Setup any custom routes
    var me = this;
    this.customRoutes.forEach(function(route) {
      app[route.method](me.apiPath + '/' + route.path, route.controller(me.mongoose));
    });

    // Send all api request to apiCall
    app.all(this.apiPath + '/*', function (req, res) {
      mongresto.apiCall(req,res);
    });

  },

  connectToDb: function(){
    // Connect to mongoose
    var dbName = this.dbName;
    this.mongoose = require("mongoose");
    this.mongoose.connect('mongodb://localhost/' + dbName);
    
    // Check connection
    this.mongoose.connection.once('open', function() {
      console.log("Mongresto: Connected to database " + dbName + "!");
    });
  },

  apiCall: function(req,res){

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

  },

  apiCallHandler: function(req,res){
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
  },

  getFileNames: function(path,callback){
    // Read a folder recursively looking for js files
    var fs = require('fs'), base = {__count:0, arr: []};
    recursiveReadDir(path);

    // Recursor
    function recursiveReadDir(path){
      base.__count++;
      fs.readdir(path,function(err,x){
        base.__count--;
        for(var j = 0; j < x.length; j++){
          i = x[j];
          if(i.indexOf(".") < 0 && !err){
            recursiveReadDir(path + i + "/",callback);
          }
          else if (i.indexOf(".js") > 0){
            base.arr.push(path + i);
          }
        }
        if(base.__count === 0){callback(base.arr);}
      });
    }
  },

  loadMongooseModels: function(){
    // Load all mongoose models
    var model, mongoose = this.mongoose;
    var models = this.mongooseModels = {};
    var modelNames = this.mongooseModelNames = [];
    this.getFileNames(this.modelPath,function(fileNames){
      fileNames.forEach(function(fileName){
        model = require(fileName)(mongoose);
        models[model.modelName.toLowerCase()] = model;
        modelNames.push(model.modelName);
      });
    });
  },

  splitUrl: function(url){
    // Remove the apiPath and then split on the first slash
    url = url.split(this.apiPath + "/")[1];
    var i = url.indexOf("/"), d = decodeURIComponent;
    i = i < 0 ? url.length : i;
    return [d(url.substring(0,i)),d(url.substring(i+1))];
  },

  createSearchObject: function(search){
    // Build the search object from a string
    // try to eval to object, otherwise, if truthy,
    // assume it is an _id, otherwise assume it is nothing

    // Jump through some hoops so we can use JSON.parse (instead of evil eval) 
    var s2 = search
      // add quotation marks around non quoted keys
      .replace(/([\{\,]\s*)([\w|\$]*)(\s*:)/g,'$1"$2"$3')
      // convert regular expressions to strings
      .replace(/:(\s*\/[^\}^,]*\w{0,1})/g,':"~regexpstart~$1~regexpend~"');
    var s3 = s2, temp;
    try {
      s3 = JSON.parse(s2);
      var t;
      // convert strings containing reg exps to real reg exps
      for(var i in s3){
        t = s3[i];
        if(t.indexOf('~regexpstart~')===0){
          t = t.replace(/~regexpstart~/g,'').replace(/~regexpend~/,'');
          t = t.split("/");
          t.shift();
          s3[i] = new RegExp(t[0],t[1] || "");
        }
      }
    } catch(e){}
    search = s3;
    
    return typeof search == "object" ?
      search : (search ? {_id:search} : {});
  },

  handleControlDirectives: function(){
    var b = this.req.body;
    this.forceArray = this.search.__forceArray;
    delete this.search.__forceArray;
    this.populate = this.search._populate;
    if(typeof this.populate != "string"){delete this.populate;}
    delete this.search._populate;
    if(this.search._relate && b.__idsToLookFor__){
      // move ids from request body to search object
      this.search = {_id: { $in: b.__idsToLookFor__} };
      delete b.__idsToLookFor__;
      for(var i in b){
        // if the "foreing key" is an array then
        // change from replacing it to adding to it
        if(this.model.schema.paths[i].instance == "Array"){
          b["$addToSet"] = b["$addToSet"] || {};
          b["$addToSet"][i] = {$each:b[i]};
          delete b[i];
        }
        // if it is not an array then make sure our input gets
        // converted from the first element of an array to a string
        else {
          b[i] = b[i][0];
        }
      }
    }
  },

  searchAllStringProps: function(val){
    if(!val){return;}
    var or = [], paths = this.model.schema.paths, obj;
    for(var i in paths){
      if(i.indexOf("_")===0 || paths[i].instance != 'String'){
        continue;
      }
      obj = {};
      obj[i] = val;
      or.push(obj);
    }
    if(!or.length){return;}
    this.search = {$or:or};
  },

  checkPermission: function(type,result){
    // Check if we have permission to ask or answer
    // a question, usig user defined functions from init options
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
  },

  runQuery: function(){

    // Check permissions
    if(!this.checkPermission("Ask")){return;}

    // Make responder remember "this"
    // - important since this is not the original mongresto object
    // but rather a clone of it (look in the apiCall method)
    var that = this, responder = function(){that.responder.apply(that,arguments);};

    if(this.method == "GET"){
      if(!this.populate){
        this.model.find(this.search,responder);
      }
      else {
        this.model.find(this.search).populate(this.populate).exec(responder);
      }
    }

    if(this.method == "DELETE"){
      this.model.find(this.search).remove(responder);
    }

    if(this.method == "PUT"){
      this.model.update(this.search,this.req.body,{multi:true},responder);
    }

    if(this.method == "POST"){
      var b = this.req.body;
      b = b.push ? b : [b];
      var l = b.length, r = [], anyError = false;
      var f = function(err,result){
        if(anyError){return;}
        if(err){responder(err,false);anyError = true;return;}
        r.push(result);
        l--;
        if(l===0){responder(false,r);}
      };
      for(var i = 0; i < l; i++){
        new this.model(b[i]).save(f);
      }
    }
  },

  responder: function(error,result,errorCode){
    // Respond to CRUD calls
    var singleton = !this.forceArray && this.req.method == "GET" && this.search._id;
    this.res.status(error ? errorCode || 500 : 200);
    result = (singleton && result && result[0]) || (!singleton && result);
    if(!this.checkPermission("Answer",result)){return;}
    this.res.json((error && {_error:error}) || result);
  },

  buildNgResourcesScript: function(req,res){
    // Auto generate frontend javascript
    // defining Angular resources
    var ngAppVarName = req.url.split("/").pop();
    var models = this.mongooseModels;
    var modelNames = this.mongooseModelNames;
    var content = "(function(){var mongresto=" +
      ("{\nngInit:" + (_mongresto+"").split("ngInit:")[3])
      .replace(/\[111\]/,JSON.stringify(modelNames))
      .replace(/\[222\]/,this.ngStopQueueOnError)
      .replace(/pathToApi/,this.apiPath)
      .replace(/ngAppName/,ngAppVarName)
      .split(', // end ng methods')[0] +
      "\n};\nmongresto.ngInit();})()";
    res.header("Content-type","application/javascript");
    res.send(content);
  },

  ngInit: function(){
    // Extend RegExp for json serialization
    RegExp.prototype.toJSON = function(){
      return "~regexpstart~"+this+"~regexpend~";
    };

    // Important global props
    this.stopQueueOnError = [222];
    this.queue = [];
    this.busy = false;
    this.callOnNoQueue = [];

    // Create resources
    var that = this;
    [111].forEach(function(x){that.ngCreateResource(x);});
  },

  ngMethods: function(){
    // Define ngResource methods
    return {
      get: { method: 'GET', isArray: true },
      getById: { method: 'GET', isArray: false },
      create: { method: 'POST', isArray: true},
      update: { method: 'PUT' },
      remove: { method: 'DELETE' }
    };
  },

  ngCreateResource: function(entity){
    var that = this, methods = this.ngMethods();
    ngAppName.factory(entity, ["$resource", function ($resource) {

      // Create an ng resource
      var re = $resource(
        "pathToApi/" + entity.toLowerCase() + "/:id/",
        {id:"@id"}, methods
      );
      
      // Wrap it in our own special object (queue handling etc)
      var obj = {
        onQueueDone: function(func){
          typeof func == "function" && that.callOnNoQueue.push(func);
        }
      };
      for(var i in methods){that.ngCreateMethod(re,obj,methods,i);}
      
      return obj;
    }]);
  },

  ngCreateMethod: function(re,obj,methods,methodName){

    var that = this, methodSpec = methods[methodName];

    // Create a method
    obj[methodName] = function(){

      // On a call to the method preprocess the arguments
      args = that.ngPreprocessArguments(arguments,methodName, methodSpec);
      var orgArgs = args[0];
      args = args[1];

      // Create an empty result to fill later
      var result = methodSpec.isArray ? [] : {};

      // Push to queue
      that.queue.push({
        re:re, orgArgs: orgArgs, args:args,
        methodName:methodName, methodSpec:methodSpec,
        result:result
      });
      // Run queue if not busy
      if(!that.busy){that.ngRunQueue();}

      // Return the result
      return result;
    };

  },

  ngPreprocessArguments: function(args, methodName, methodSpec){
    // Preprocesses arguments to different methods
    args = Array.prototype.slice.call(args);
    var orgArgs = [].concat(args);
    // One argument less than ng standard for create
    if(methodName == "create"){args.unshift({});}
    // Strings are ids
    if(typeof args[0] == "string"){args[0] = {_id:args[0]};}
    // Ask backend to sometimes force arrays to avoid ng errors
    var onlyId = true;
    for(var i in args[0]){
      if(i == "_id" || i == "_populate"){continue;}
      onlyId = false;
    }
    if(args[0] && onlyId && methodSpec.isArray){
      args[0].__forceArray = true;
    }
    
    // Stringify search object
    if(typeof args[0] == "object" && !args[0].id){
      args[0] = {
        id:JSON.stringify(args[0])
        .replace(/"~regexpstart~/g,'')
        .replace(/~regexpend~"/g,'')
      };
    }

    return [orgArgs, args];
  },

  ngRunQueue: function(){
    // Read from queue
    this.busy = true;
    var r = this.queue.shift(), that = this;
    // Add a callback function to run when the results are back
    var orgCallback = typeof r.args[r.args.length-1] == "function" && r.args.pop();
    var newCallback = function(){
      var i, isArr = r.result.push;
      // Transfer result to waiting array or object
      if(isArr){for(i = 0; i < result.length; i++){r.result.push(result[i]);}}
      else {for(i in result){r.result[i] = result[i];}}
      var oldLength = that.queue.length;
      orgCallback && orgCallback.apply(r.re,arguments);
      // Reorganize queue for more syncronous feel
      // if we are called in a callback
      var moveFirst = [];
      while(that.queue.length > oldLength){moveFirst.push(that.queue.pop());}
      while(moveFirst.length){that.queue.unshift(moveFirst.shift());}
      // We are done - run next item in queue?
      that.busy = false;
      that.queue.length && that.ngRunQueue();
      // The queue is empty and the last result is back
      if(!that.queue.length && !that.busy){
        while(that.callOnNoQueue.length){that.callOnNoQueue.shift()();}
      }
    };
    if(this.stopQueueOnError){r.args.push(newCallback);}
    else {r.args.push(newCallback, newCallback);}
    // Call ngResource object
    this.ngHandleRelate(r);
    var result = r.re[r.methodName].apply(r.re,r.args);
  },

  ngHandleRelate: function(r){
    // Check if we need to handle update _relate actions
    if(
      r.methodName != "update" ||
      !r.orgArgs[0] ||
      !r.orgArgs[0]._relate
    ){
      return;
    }
    
    // Rebuild the search object from the _relate object
    var u = r.orgArgs[0]._relate;
    var obj = {};
    for(var i in u){
      obj[i] = obj[i] || [];
      u[i] = u[i].push ? u[i] : [u[i]];
      for(var j = 0; j < u[i].length; j++){
        u[i][j]._id && obj[i].push(u[i][j]._id);
      }
    }
    
    // Add ids to look for to request body
    if(obj.items){
      obj.__idsToLookFor__ = obj.items;
      delete obj.items;
      r.args[0] = {id: '{_relate:true}'};
      r.args.splice(1,0, obj);
    }
  }, // end ng methods

};})();