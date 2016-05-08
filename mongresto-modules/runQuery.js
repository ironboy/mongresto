/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function runQuery(){
   // Check permissions
  if(!this.checkPermission("Ask")){return;}
   // Make responder remember "this"
  // - important since this is not the original mongresto object
  // but rather a clone of it (look in the apiCall method)
  var i, r, that = this, responder = function(){that.responder.apply(that,arguments);};
   // Special operators like _populate, _sort, _skip, _limit;
  this.search._populate = this.populate;
  var specialNames = ["_populate","_sort","_skip","_limit"], specials = {};
  for(i in this.search){
    if(specialNames.indexOf(i) < 0){ continue; }
    if(this.search[i] !== undefined){
      specials[i.substr(1)] = this.search[i];
    }
    delete this.search[i];
  }
   if(this.method == "GET"){
    r = this.model.find(this.search);
    for(i in specials){ r = r[i](specials[i]); }
    r.exec(responder);
  }
   if(this.method == "DELETE"){
    this.model.find(this.search).remove(responder);
  }
   if(this.method == "PUT"){
    this.model.update(this.search,this.req.body,{multi:true},responder);
  }
   if(this.method == "POST"){
    var b = this.req.body;
    b = b.push ? b : [b];
    var l = b.length, anyError = false;
    r = [];
    var f = function(err,result){
      if(anyError){return;}
      if(err){responder(err,false);anyError = true;return;}
      r.push(result);
      l--;
      if(l===0){responder(false,r);}
    };
    for(i = 0; i < l; i++){
      new this.model(b[i]).save(f);
    }
  }
};
