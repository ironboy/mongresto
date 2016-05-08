/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function ngRunQueue(){
  // Read from queue
  this.busy = true;
  var r = this.queue.shift(), that = this;
  // Add a callback function to run when the results are back
  var orgCallback = typeof r.args[r.args.length-1] == "function" && r.args.pop();
  var newCallback = function(){
    var i, isArr = r.result.push;
    // Transfer result to waiting array or object
    if(isArr){for(i = 0; i < result.length; i++){r.result.push(result[i]);}}
    else {for(i in result){r.result[i] = result[i];}}
    var oldLength = that.queue.length;
    orgCallback && orgCallback.apply(r.re,arguments);
    // Reorganize queue for more syncronous feel
    // if we are called in a callback
    var moveFirst = [];
    while(that.queue.length > oldLength){moveFirst.push(that.queue.pop());}
    while(moveFirst.length){that.queue.unshift(moveFirst.shift());}
    // We are done - run next item in queue?
    that.busy = false;
    that.queue.length && that.ngRunQueue();
    // The queue is empty and the last result is back
    if(!that.queue.length && !that.busy){
      while(that.callOnNoQueue.length){that.callOnNoQueue.shift()();}
    }
  };
  if(this.stopQueueOnError){r.args.push(newCallback);}
  else {r.args.push(newCallback, newCallback);}
  // Call ngResource object
  this.ngHandleRelate(r);
  var result = r.re[r.methodName].apply(r.re,r.args);
};
