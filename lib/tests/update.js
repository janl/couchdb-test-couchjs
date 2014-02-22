var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("update", function() { with(this) {

  it('should return a doc and a resp body', function(resume) { with(this) {

    var qs = QueryServer();

    var ddoc = qs.make_ddoc({
      updates: {
        basic: (function(doc, req) {
          doc.world = "hello";
          var resp = [doc, "hello doc"];
          return resp;
        }).toString()
      }
    });
    async.series([
      qs.reset(),
      qs.teach_ddoc(ddoc),
      qs.update(ddoc, ['updates', 'basic'], [
        {foo: 'gnarly'},
        {method: 'POST'}
      ]),
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual({foo: 'gnarly', world: 'hello'}, results[2][0]);
        assertEqual({body: 'hello doc'}, results[2][1]);
      });
    });
  }});

}});
