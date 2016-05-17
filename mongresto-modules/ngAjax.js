module.exports = function ngAjax(s){
  var x = new XMLHttpRequest(), success;
  x.open(s.method,s.url,true);
  x.setRequestHeader('Content-type', 'application/json');
  (s.method == 'POST' || s.method == 'PUT') ? x.send(s.data) : x.send();
  x.onreadystatechange = function() {
    if(x.readyState != 4){ return; }
    success = x.status >= 200 && x.status < 400;
    success ? s.success(JSON.parse(x.responseText)) : s.error(x);
  };
};