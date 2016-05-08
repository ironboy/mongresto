/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function ngMockNgApp(ngAppVarName){
  // Mocks ng factory and recreates
  // necessary features of ngResource
  // for frontend running without Angular
  var t = this;
  var dad = window[ngAppVarName == "$" ? 'jQuery' : ngAppVarName];
  if(!dad){ window[ngAppVarName] = dad = {}; }
  
  return {
    factory: function(entity,func){
      dad[entity] = func.pop()(function(path,queryParam,methods){
        var obj = {};
        while(path.substr(-1) == '/'){ path = path.substr(0,path.length -1);}
        for(var i in methods){
          (function(){
            var isArray = methods[i].isArray,
                method = methods[i].method;
            obj[i] = function(){
              var toReturn = isArray ? [] : {},
                  query = method != "POST" && arguments[0],
                  payload = (method == "POST" || method == "PUT") && arguments[1];
                  cb = arguments[arguments.length - 1];
              query = query && typeof query != "function" ? query : "";
              cb = typeof cb == "function" ? cb : function(){};
              query = query ? query.id : "";
              query && (query = query.replace(/"~regexpstart~/g,''));
              query && (query = query.replace(/~regexpend~"/g,''));
              query = encodeURIComponent(query);
              t.ngMockNgAppAjax(path,query,method,payload,isArray,cb,toReturn);
              return toReturn;
            };
          })();
        }
        return obj; // return mock $resource object
       });
    }
  };
};
