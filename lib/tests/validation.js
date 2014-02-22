var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("validation", function() { with(this) {

  it('should allow good updates', function(resume) { with(this) {

    var qs = QueryServer();

    var ddoc = qs.make_ddoc({
      validate_doc_update: (function(newDoc, oldDoc, userCtx) {
      if(newDoc.bad)
        throw({forbidden:"bad doc"}); "foo bar";
      }).toString()
    });
    async.series([
      qs.reset(),
      qs.teach_ddoc(ddoc),
      qs.validate(ddoc, {good: true})
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual(1, results[2]);
      });
    });
  }});

  it('should reject invalid updates', function(resume) { with(this) {

    var qs = QueryServer();

    var ddoc = qs.make_ddoc({
      validate_doc_update: (function(newDoc, oldDoc, userCtx) {
      if(newDoc.bad)
        throw({forbidden:"bad doc"}); "foo bar";
      }).toString()
    });
    async.series([
      qs.reset(),
      qs.teach_ddoc(ddoc),
      qs.validate(ddoc, {bad: true})
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual({forbidden: 'bad doc'}, results[2]);
      });
    });
  }});

}});
