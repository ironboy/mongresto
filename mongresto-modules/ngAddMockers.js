/* jshint
loopfunc: true,
trailing: true,
sub: true,
expr: true,
noarg: false,
forin: false
*/
module.exports = function ngAddMockers(obj){
  Object.assign(obj,{
    // mock collection data from an object with seeds
    // {prop1: [randomVal1, randomVal2, randomVal3],
    //  prop2: [randomVal1, randomVal2, randomVal3] }
    mock: function(seeds,cb){
      var items = seeds._items, dummyData = [];
      while(items--){
        var obj = {};
        for(var i in seeds){
          if(!seeds[i]){ continue; }
          if(seeds[i].constructor === Array){
             obj[i] = seeds[i][Math.floor(Math.random()*seeds[i].length)];
          }
          if(seeds[i].constructor === Function){
            obj[i] = seeds[i]();
          }
        }
        dummyData.push(obj);
      }
      return this.create(dummyData,cb);
    },
    // only mock if the collection is empty
    mockIfEmpty: function(seeds,cb){
      var t = this, arr = [];
      t.get(function(x){
        if(!x.length){
          t.mock(seeds,function(x){
            arr.push.apply(arr,x);
            cb(arr);
          });
        }
        else {cb(arr);}
      });
      return arr;
    }
  });
};
