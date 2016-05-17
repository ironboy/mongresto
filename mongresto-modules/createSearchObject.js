module.exports = function createSearchObject(search){
  // Build the search object from a string
  // try to eval to object, otherwise, if truthy,
  // assume it is an _id, otherwise assume it is nothing
   // Jump through some hoops so we can use JSON.parse (instead of evil eval) 
  var s2 = search
    // add quotation marks around non quoted keys
    .replace(/([\{\,]\s*)([\w|\$]*)(\s*:)/g,'$1"$2"$3')
    // convert regular expressions to strings
    .replace(/:(\s*\/[^\}^,]*\w{0,1})/g,':"~regexpstart~$1~regexpend~"');
  var s3 = s2, temp;
  try {
    s3 = JSON.parse(s2,function(key,t){
      if((t+'').indexOf('~regexpstart~')===0){
        t = t.replace(/~regexpstart~/g,'').replace(/~regexpend~/,'');
        t = t.split("/");
        t.shift();
        t = new RegExp(t[0],t[1] || "");
      }
      return t;
    });
  } catch(e){}
  search = s3;
  return typeof search == "object" ?
    search : (search ? {_id:search} : {});
};
