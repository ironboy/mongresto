/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function ngMockNgAppAjax(path,query,method,payload,isArray,cb,toReturn){
  var ajax = window.jQuery ? jQuery.ajax : this.ngAjax;
  ajax({
    url: path.split(':id').join(query),
    method: method,
    contentType: "application/json",
    dataType: "json",
    processData: false,
    data: payload ? JSON.stringify(payload) : '',
    success: function(data){
      if(isArray){
        data && data.constructor !== Array && (data = [data]);
        toReturn.push.apply(toReturn,data);
      }
      else {
        for(var i in data){
          toReturn[i] = data[i];
        }
      }
      cb(toReturn);
    },
    error: function(err){
      cb(err);
    }
  });
};
