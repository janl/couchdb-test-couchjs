var JS = require('jstest');
var async = require('async');
var CouchJS = require('../../lib/couchjs');
var queryServer = require('../../lib/query_server');


JS.Test.describe("map", function() { with(this) {
  var couchjs = CouchJS();

  it('should run map functions', function(resume) { with(this) {

    var reset_qs = function(cb) {
      couchjs.write('["reset"]', cb);
    };

    var teach_ddoc = function(cb) {
      var ddoc = queryServer.make_ddoc({});
      var cmd = JSON.stringify(["ddoc", "new", ddoc._id, ddoc]);
      couchjs.write(cmd, cb);
    };

    var add_fun_a = function(cb) {
      var emit_twice = (function(doc){
        emit("foo",doc.a);
        emit("bar",doc.a);
      }).toString();

      var cmd = JSON.stringify(['add_fun', emit_twice]);
      couchjs.write(cmd, cb);
    };

    var add_fun_b = function(cb) {
      var emit_once = (function(doc){
        emit("baz",doc.a);
      }).toString();

      var cmd = JSON.stringify(['add_fun', emit_once]);
      couchjs.write(cmd, cb);
    };

    var map_doc = function(cb) {
      var cmd = JSON.stringify(['map_doc', {a: "b"}]);
      couchjs.write(cmd, cb);
    };

    async.series([
      reset_qs,
      teach_ddoc,
      add_fun_a,
      add_fun_b,
      map_doc
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual(true, results[2]);
        assertEqual(true, results[3]);
        assertEqual(['foo', 'b'], results[4][0][0]);
        assertEqual(['bar', 'b'], results[4][0][1]);
        assertEqual(['baz', 'b'], results[4][1][0]);
      });
    });

  }});
}});