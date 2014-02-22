var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("changes filter", function() { with(this) {

  it('should only return true for good docs', function(resume) { with(this) {

    var qs = QueryServer();

    var ddoc = qs.make_ddoc({
      filters: {
        basic: (function(doc, req) {
          if (doc.good) {
            return true;
          }
       }).toString()
      }
    });
    async.series([
      qs.reset(),
      qs.teach_ddoc(ddoc),
      qs.changes_filter(ddoc, ['filters', 'basic'], [
        {foo: 'bar'},
        {good: 'yay'},
        {banana: 7}
      ]),
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual(false, results[2][0]);
        assertEqual(true, results[2][1]);
        assertEqual(false, results[2][2]);
      });
    });
  }});

}});
