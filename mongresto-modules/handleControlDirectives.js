/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function handleControlDirectives(){
  var b = this.req.body;
  this.forceArray = this.search.__forceArray;
  delete this.search.__forceArray;
  this.populate = this.search._populate;
  if(typeof this.populate != "string"){delete this.populate;}
  delete this.search._populate;
  if(this.search._relate && b.__idsToLookFor__){
    // move ids from request body to search object
    this.search = {_id: { $in: b.__idsToLookFor__} };
    delete b.__idsToLookFor__;
    for(var i in b){
      // if the "foreign key" is an array then
      // change from replacing it to adding to it
      if(this.model.schema.paths[i].instance == "Array"){
        b["$addToSet"] = b["$addToSet"] || {};
        b["$addToSet"][i] = {$each:b[i]};
        delete b[i];
      }
      // if it is not an array then make sure our input gets
      // converted from the first element of an array to a string
      else {
        b[i] = b[i][0];
      }
    }
  }
};
