var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("design doc", function() { with(this) {

  it('should teach a design doc', function(resume) { with(this) {

    var qs = QueryServer();

    async.series([
      qs.reset(),
      qs.teach_ddoc({}),
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
      });
    });
  }});
}});
