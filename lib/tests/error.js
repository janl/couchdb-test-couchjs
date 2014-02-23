var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("recoverable errors", function() { with(this) {

  it('should not exist', function(resume) { with(this) {

    var qs = QueryServer();

    var ddoc = qs.make_ddoc({
      shows: {
        error: (function() {
          throw(["error","error_key","testing"]);
        }).toString()
      }
    });
    async.series([
      qs.reset(),
      qs.teach_ddoc(ddoc),
      qs.show(ddoc, {title: 'Best Ever', body: 'Doc Body'}, 'error'),
      qs.reset()
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual(['error', 'error_key', 'testing'], results[2]);
        assertEqual(true, results[3]);
      });
    });
  }});

}});

