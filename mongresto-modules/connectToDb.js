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
  var t = this;
  t.mongoose = require("mongoose");
  t.mongoose.connect(t.protocolName + '://' + t.serverName + '/' + t.dbName);
 
  // Check connection
  t.mongoose.connection.once('open', function() {
    console.log("Mongresto: Connected to database " + t.dbName + "!");
  });
};
