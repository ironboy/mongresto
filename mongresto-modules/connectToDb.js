/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function connectToDb(){
  // Connect to mongoose
  var dbName = this.dbName;
  this.mongoose = require("mongoose");
  this.mongoose.connect('mongodb://localhost/' + dbName);
  
  // Check connection
  this.mongoose.connection.once('open', function() {
    console.log("Mongresto: Connected to database " + dbName + "!");
  });
};
