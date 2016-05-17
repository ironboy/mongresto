module.exports = function ngPreprocessArguments(args, methodName, methodSpec){
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
};
