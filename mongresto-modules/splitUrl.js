/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function splitUrl(url){
  // Remove the apiPath and then split on the first slash
  url = url.split(this.apiPath + "/")[1];
  var i = url.indexOf("/"), d = decodeURIComponent;
  i = i < 0 ? url.length : i;
  return [d(url.substring(0,i)),d(url.substring(i+1))];
};
