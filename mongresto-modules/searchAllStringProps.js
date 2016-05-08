/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function searchAllStringProps(val){
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
};
