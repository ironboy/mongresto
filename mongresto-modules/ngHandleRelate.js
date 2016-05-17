module.exports = function ngHandleRelate(r){
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
};
