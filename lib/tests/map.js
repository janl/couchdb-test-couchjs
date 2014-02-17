var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("map", function() { with(this) {

  it('should run map functions', function(resume) { with(this) {

    var qs = QueryServer();

    async.series([
      qs.reset(),
      qs.teach_ddoc({}),
      qs.add_fun(function(doc){
        emit("foo",doc.a);
        emit("bar",doc.a);
      }),
      qs.add_fun(function(doc){
        emit("baz",doc.a);
      }),
      qs.map_doc({a: "b"})
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
