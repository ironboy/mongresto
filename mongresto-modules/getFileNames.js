/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function getFileNames(path,callback){
   var mpath = require("path"),
       appRoot = '' + require('app-root-path');
   path = mpath.normalize(appRoot + '/' + path);
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
      if(base.__count === 0){
        callback(base.arr);
      }
    });
  }
};
