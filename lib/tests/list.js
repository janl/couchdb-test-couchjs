var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("list", function() { with(this) {

  before(function(resume) { with(this) {
    this.qs = QueryServer();

    this.ddoc = this.qs.make_ddoc({
      lists: {
        simple: (function(head, req) {
          send("first chunk");
          send(req.q);
          var row;
          while(row = getRow()) {
            send(row.key);
          };
          return "early";
        }).toString()
      }
    });
    this.qs.teach_ddoc(this.ddoc)(resume);
  }});

  it('example list', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'simple'], [
        {foo: 'bar'},
        {q: 'ok'}
      ]),
      qs.list_row({key: 'foo'}),
      qs.list_row({key: 'bar'}),
      qs.list_row({key: 'baz'}),
      qs.list_row({key: 'qux'}),
      qs.list_row({key: 'quux'}),
      qs.list_end()
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual('start', results[0][0]);
        assertEqual(['first chunk', 'ok'], results[0][1]);
        assertEqual({headers: {}}, results[0][2]);
        assertEqual(['chunks', ['foo']], results[1]);
        assertEqual(['chunks', ['bar']], results[2]);
        assertEqual(['chunks', ['baz']], results[3]);
        assertEqual(['chunks', ['qux']], results[4]);
        assertEqual(['chunks', ['quux']], results[5]);
      });
    });
  }});

}});
