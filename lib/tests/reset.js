var JS = require('jstest');
var async = require('async');
var CouchJS = require('../../lib/couchjs');
var queryServer = require('../../lib/query_server');


JS.Test.describe("reset", function() { with(this) {
  var couchjs = CouchJS();

  it('should reset', function(resume) { with(this) {
    couchjs.write('["reset"]', function(error, result) {
      resume(function() {
        assertEqual(true, result);
      });
    });
  }});

  it('should not erase ddocs on reset', function(resume) { with(this) {
    var ddoc = queryServer.make_ddoc({
      shows: {
        bar: (function(doc, req) {
          log('ok');
          return doc.title + ' ' + doc.body;
        }).toString()
      }
    });

    var teach_ddoc = function(cb) {
      var cmd = JSON.stringify(["ddoc", "new", ddoc._id, ddoc]);
      couchjs.write(cmd, cb);
    };

    var reset_qs = function(cb) {
      couchjs.write('["reset"]', cb);
    };

    var run_show = function(cb) {
      var doc = {
        title: 'Hey',
        body: 'there'
      };

      var cmd = JSON.stringify(["ddoc", ddoc._id, ["shows", "bar"], [doc]]);
      couchjs.write(cmd, cb);
    };

    async.series([
      teach_ddoc,
      reset_qs,
      run_show
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
