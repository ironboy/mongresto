  module.exports = function cacheHeaders(app){
  var bootstrapStartGMT = new Date().toGMTString(), t = this;
  if(!t.controlCacheHeaders){ return; }
  app.disable('x-powered-by');
  app.all('*',function(req,res,next){
    var isRest = (req.url + '/').indexOf(t.apiPath + '/') === 0 &&
          (req.url + '/').indexOf(t.clientsideJsPath + '/') !== 0,
        lm = isRest ? new Date().toGMTString() : bootstrapStartGMT,
        etag = require("sha1")(req.url + '*' + lm);
    res.header('X-Powered-By', 'Mongresto');
    res.set("Cache-Control", "public, max-age=0");
    res.set('ETag', etag);
    res.set("X-Is-Rest",isRest);
    res.set('Last-Modified', lm);
    if(req.get('If-Modified-Since') == lm && req.get('If-None-Match') == etag){
      // Tell the client the content was not modified
      res.taken = true;
      res.status(304);
      res.end('');
    }
    else {
      next();
    }
  });
};
