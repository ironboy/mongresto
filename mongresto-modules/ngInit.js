module.exports = function ngInit(){
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
};
