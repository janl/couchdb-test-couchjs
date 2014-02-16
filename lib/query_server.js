module.exports = {
  make_ddoc: function(obj) {
    var ddoc = {
      _id: '_design/foo',
    };
    for(var name in obj) {
      ddoc[name] = obj[name];
    }
    return ddoc;
  }
};