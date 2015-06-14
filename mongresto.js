/*
  mongresto 0.17

  June 2015 Nodebite AB, Thomas Frank

  MIT Licensed - use anywhere you want!

  A mongodb REST service for Node.js Express + mongoose
  working with mongoose models
  + generating Angular resource objects on the fly
*/
var mongresto = {

  init: function(app,dbName,apiPath,modelPath,ngResourcesPath){

    // Defaults
    console.log('Mongresto: Initializing!');
    this.apiPath = apiPath || "/api";
    this.modelPath = modelPath || "./mongoose-models/";
    this.ngResourcesPath = ngResourcesPath || "/api/ngresources";
    this.dbName = dbName || "test";

    // Connect to mongoose
    this.mongoose = require("mongoose");
    this.mongoose.connect('mongodb://localhost/' + this.dbName);
    
    // Check connection
    this.mongoose.connection.once('open', function() {
      console.log("Mongresto: Connected to database!");
    });

    // Load mongoose models
    this.loadMongooseModels();

    // A url path that will respond with ngresources
    app.get(this.ngResourcesPath + '/*', function (req, res) {
      mongresto.buildNgResourcesScript(req,res);
    });

    // Send all api request to apiCall
    app.all(this.apiPath + '/*', function (req, res) {
      mongresto.apiCall(req,res);
    });

  },

  apiCall: function(req,res){

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

    // Jump through som hoops so we can use JSON.parse (instead of evil eval) 
    var s2 = search
      // add quotation marks around non quoted keys
      .replace(/([\{\,]\s*)(\w*)(\s*:)/g,'$1"$2"$3')
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

  runQuery: function(){
    if(this.method == "GET"){
      if(!this.populate){
        this.model.find(this.search,this.responder);
      }
      else {
        this.model.find(this.search).populate(this.populate).exec(this.responder);
      }
    }
    if(this.method == "DELETE"){
      this.model.find(this.search).remove(this.responder);
    }
    if(this.method == "PUT"){
      this.model.update(this.search,this.req.body,{multi:true},this.responder);
    }
    if(this.method == "POST"){
      // A bit more complex than the other calls since we want to allow
      // multiple items to be created at once
      var b = this.req.body, that = this;
      b = b.push ? b : [b];
      var l = b.length, r = [], anyError = false;
      for(var i = 0; i < l; i++){
        new this.model(b[i]).save(f);
      }
      function f(err,result){
        if(anyError){return;}
        if(err){that.responder(err,false);anyError = true;return;}
        r.push(result);
        l--;
        if(l===0){that.responder(false,r);}
      }
    }
  },

  responder : function(error,result){
    // Respond to CRUD calls
    var that = mongresto;
    var singleton = !that.forceArray && that.req.method == "GET" && that.search._id;
    that.res.status(error ? 500 : 200);
    that.res.json(
      (error && {_error:error}) ||
      (singleton && result[0]) ||
      (!singleton && result)
    );
  },

  buildNgResourcesScript: function(req,res){
    // Auto generate frontend javascript
    // defining Angular resources
    var ngAppVarName = req.url.split("/").pop();
    var models = this.mongooseModels;
    var modelNames = this.mongooseModelNames;
    var content = (this.ngResourcesScriptTemplate+"")
      .replace(/\n\s{4,4}/g,'\n')
      .replace(/\[111\]/,JSON.stringify(modelNames))
      .replace(/pathToApi/,this.apiPath)
      .replace(/ngAppName/,ngAppVarName)
      .split("\n");
    content.shift(); content.pop(); content = content.join("\n");
    res.header("Content-type","application/javascript");
    res.send(content);
  },

  // Template used by buildNgResourcesScript
  // this is a long intricate method (never called on the backend)
  // unfortunately it is hard to refactor into small clean methods
  // but it it the tool we need to write superclean ng controller code
  ngResourcesScriptTemplate: function(){
    // Autogenerate ngResources
    // and wrap in a queue system
    // that make them "synchronous"
    // i.e. executes method calls in order
    (function(){
      // Create the following ngResources
      var models = [111];
      // Extend RegExp for json serialization
      RegExp.prototype.toJSON = function(){
        return "~regexpstart~"+this+"~regexpend~";
      };
      // Handle relations
      function handleRelate(r){
        if(r.methodName == "update" && r.orgArgs[0] && r.orgArgs[0]._relate){
          var u = r.orgArgs[0]._relate;
          var obj = {};
          for(var i in u){
            obj[i] = obj[i] || [];
            u[i] = u[i].push ? u[i] : [u[i]];
            for(var j = 0; j < u[i].length; j++){
              u[i][j]._id && obj[i].push(u[i][j]._id);
            }
          }
          if(obj.items){
            obj.__idsToLookFor__ = obj.items;
            delete obj.items;
            r.args[0] = {id: '{_relate:true}'};
            r.args.splice(1,0, obj);
          }
        }
         
      }
      // Queue and queue handler engine
      var queue = [], busy = false, callOnNoQueue = [];
      function runQueue(){
        busy = true;
        var r = queue.shift();
        var orgCallback = typeof r.args[r.args.length-1] == "function" && r.args.pop();
        r.args.push(function(){
          var i;
          if(r.result.push){
            for(i = 0; i < result.length; i++){r.result.push(result[i]);}
          }
          else {
            for(i in result){r.result[i] = result[i];}
          }
          var oldLength = queue.length;
          orgCallback && orgCallback.apply(r.re,arguments);
          // Reorganize queue for more syncronous feel
          // if we are called in a callback
          var moveFirst = [];
          while(queue.length > oldLength){
            moveFirst.push(queue.pop());
          }
          while(moveFirst.length){
            queue.unshift(moveFirst.shift());
          }
          busy = false;
          queue.length && runQueue();
          if(!queue.length && !busy){
            while(callOnNoQueue.length){callOnNoQueue.shift()();}
          }
        });
        handleRelate(r);
        var result = r.re[r.methodName].apply(r.re,r.args);
      }
      // Loop through model names
      models.forEach(function(entity){
        // Create an ng resource
        ngAppName.factory(entity, ["$resource", "$timeout", function ($resource) {
          var methods = {
            get: { method: 'GET', isArray: true },
            getById: { method: 'GET', isArray: false },
            create: { method: 'POST', isArray: true},
            update: { method: 'PUT' },
            remove: { method: 'DELETE' }
          };
          var re = $resource(
            "pathToApi/" + entity.toLowerCase() + "/:id/",
            {id:"@id"}, methods
          );
          // Wrap it in our own queue handler
          var obj = {};
          for(var i in methods){
            (function(){
              var methodName = i, methodSpec = methods[i];
              obj[i] = function(){
                var args = Array.prototype.slice.call(arguments);
                var orgArgs = [].concat(args);
                if(methodName == "create"){args.unshift({});}
                if(typeof args[0] == "string"){
                  args[0] = {_id:args[0]};
                }
                var onlyId = true;
                for(var i in args[0]){
                  if(i == "_id" || i == "_populate"){continue;}
                  onlyId = false;
                }
                if(args[0] && onlyId && methodSpec.isArray){args[0].__forceArray = true;}
                if(typeof args[0] == "object" && !args[0].id){
                  args[0] = {
                    id:JSON.stringify(args[0])
                    .replace(/"~regexpstart~/g,'')
                    .replace(/~regexpend~"/g,'')
                  };
                }
                var result = methodSpec.isArray ? [] : {};
                queue.push({
                  re:re,
                  orgArgs: orgArgs,
                  args:args,
                  methodName:methodName,
                  methodSpec:methodSpec,
                  result:result
                });
                if(!busy){runQueue();}
                return result;
              };
            })();
          }
          obj.onQueueDone = function(func){
            if(typeof func != "function"){return;}
            callOnNoQueue.push(func);
          }
          return obj;
        }]);
      });
    })();
  }

};

// Export the mongresto object as a module
module.exports = mongresto;