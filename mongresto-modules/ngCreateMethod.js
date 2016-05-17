module.exports = function ngCreateMethod(re,obj,methods,methodName){
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
 };
