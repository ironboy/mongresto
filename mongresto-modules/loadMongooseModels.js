/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function loadMongooseModels(){
  // Load all mongoose models
  var res, model, mongoose = this.mongoose;
  var models = this.mongooseModels = {};
  var modelNames = this.mongooseModelNames = [];
  this.getFileNames(this.modelPath,function(fileNames){
    fileNames.forEach(function(fileName){
      model = require(fileName)(mongoose);
      models[model.modelName.toLowerCase()] = model;
      modelNames.push(model.modelName);
      res();
    });
  });
  return new Promise(function(a){ res = a; });
};
