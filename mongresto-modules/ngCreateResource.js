module.exports = function ngCreateResource(entity){
  var that = this, methods = this.ngMethods(), app = window["ngAppName"];
  (app && app.factory) || (app = this.ngMockNgApp("ngAppName"));
  app.factory(entity, ["$resource", function ($resource) {
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
    that.ngAddMockers(obj);
    for(var i in methods){that.ngCreateMethod(re,obj,methods,i);}
    return obj;
  }]);
};
