var CouchJS = require('./couchjs');

module.exports = function() {
  var couchjs = CouchJS();

  var make_ddoc = function(obj) {
    var ddoc = {
      _id: '_design/foo',
    };
    for(var name in obj) {
      ddoc[name] = obj[name];
    }
    return ddoc;
  };

  return {
    map_doc: function(doc) {
      return function(cb) {
        var cmd = JSON.stringify(['map_doc', doc]);
        couchjs.write(cmd, cb);
      }
    },

    reduce: function(fun, kvs) {
      return function(cb) {
        var cmd = JSON.stringify(['reduce', [(fun).toString()], kvs]);
        couchjs.write(cmd, cb);
      }
    },

    rereduce: function(fun, kvs) {
      return function(cb) {
        var cmd = JSON.stringify(['rereduce', [(fun).toString()], kvs]);
        couchjs.write(cmd, cb);
      }
    },

    add_fun: function(fun) {
      return function(cb) {
        var cmd = JSON.stringify(['add_fun', (fun).toString()]);
        couchjs.write(cmd, cb);
      }
    },

    teach_ddoc: function(obj) {
      return function(cb) {
        var ddoc = make_ddoc(obj);
        var cmd = JSON.stringify(["ddoc", "new", ddoc._id, ddoc]);
        couchjs.write(cmd, cb);
      }
    },

    run_show: function(doc) {
      return function(cb) {
        var cmd = JSON.stringify(["ddoc", make_ddoc()._id, ["shows", "bar"], [doc]]);
        couchjs.write(cmd, cb);
      }
    },

    reset: function() {
      return function(cb) {
        couchjs.write('["reset"]', cb);
      }
    }
  };
};
