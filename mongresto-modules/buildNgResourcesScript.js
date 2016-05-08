/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function buildNgResourcesScript(req,res){

  // Use cache is existant
  if(this.clientCode && this.clientCode[req.url]){
    sender(this.clientCode[req.url]);
    return;
  }

  // Auto generate frontend javascript
  // defining Angular resources
  var ngAppVarName, urlp = req.url.split('/'), code = '', tmp,
      models = this.mongooseModels,
      modelNames = this.mongooseModelNames;

  while(!ngAppVarName && urlp.join('/').length > this.clientsideJsPath.length){
    ngAppVarName = urlp.pop();
  }
  
  Object.keys(this).forEach(function(x){
    if(x.indexOf('ng') === 0 && typeof this[x] == "function"){
      tmp = (this[x] + '');
      tmp = tmp.substr(tmp.indexOf('('));
      code += (code ? ',\n' : '') +x + ': function' + tmp;
    }
  },this);
  code = '(function(){var mongresto={' + code + '};\nmongresto.ngInit();})()';
  code = code.replace(/\[111\]/,JSON.stringify(modelNames))
    .replace(/\[222\]/,this.ngStopQueueOnError)
    .replace(/pathToApi/,this.apiPath)
    .replace(/ngAppName/g,ngAppVarName);
  code = require('uglify-js').minify(code, {fromString: true}).code;
  code = '/* npm install mongresto\nfrom Nodebite, MIT-licensed,\n' +
    'this part is the dynamically generated client-side script */\n' + code;
  this.clientCode = this.clientCode || {};
  this.clientCode[req.url] = code;
  sender(code);

  function sender(code){
    res.header("Content-type","application/javascript");
    res.send(code);
  }

};
