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
  this.mongoose = require("mongoose");
  this.mongoose.connect(this.protocolName + '://' + this.serverName + '/' + this.dbName);
 
  // Check connection
  this.mongoose.connection.once('open', function() {
    console.log("Mongresto: Connected to database " + this.dbName + "!");
  });
};
