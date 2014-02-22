var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("show", function() { with(this) {

  it('should show', function(resume) { with(this) {

    var qs = QueryServer();

    var ddoc = qs.make_ddoc({
      shows: {
        simple: (function(doc, req) {
            log("ok");
            return [doc.title, doc.body].join(' - ');
        }).toString()
      }
    });
    async.series([
      qs.reset(),
      qs.teach_ddoc(ddoc),
      qs.show(ddoc, {title: 'Best Ever', body: 'Doc Body'}, 'simple')
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual({body: 'Best Ever - Doc Body'}, results[2]);
      });
    });
  }});

  it('should show with headers', function(resume) { with(this) {

    var qs = QueryServer();

    var ddoc = qs.make_ddoc({
      shows: {
        simple: (function(doc, req) {
          var resp = {"code":200, "headers":{"X-Plankton":"Rusty"}};
          resp.body = [doc.title, doc.body].join(' - ');
          return resp;
        }).toString()
      }
    });
    async.series([
      qs.reset(),
      qs.teach_ddoc(ddoc),
      qs.show(ddoc, {title: 'Best Ever', body: 'Doc Body'}, 'simple')
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual(true, results[1]);
        assertEqual({
          code: 200,
          headers: {
            'X-Plankton': 'Rusty'
          },
          body: 'Best Ever - Doc Body'
        }, results[2]);
      });
    });
  }});


}});

