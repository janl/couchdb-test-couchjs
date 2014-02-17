var JS = require('jstest');
var async = require('async');
var CouchJS = require('../../lib/couchjs');
var QueryServer = require('../../lib/query_server');


JS.Test.describe("reset", function() { with(this) {
  var qs = QueryServer();

  it('should reset', function(resume) { with(this) {
    async.series([
      qs.reset()
    ], function(error, result) {
      resume(function() {
        assertEqual(true, result[0]);
      });
    });
  }});


  it('should not erase ddocs on reset', function(resume) { with(this) {

    async.series([
      qs.teach_ddoc({
        shows: {
          bar: (function(doc, req) {
            log('ok');
            return doc.title + ' ' + doc.body;
          }).toString()
        }
      }),
      qs.reset(),
      qs.run_show({
        title: 'Hey',
        body: 'there'
      })
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual('Hey there', results[2].body);
      });
    });

  }});

}});
