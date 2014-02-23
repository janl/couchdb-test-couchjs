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
        }).toString(),
      headers: (function(head, req) {
          start({headers:{"Content-Type" : "text/plain"}});
          send("first chunk");
          send('second "chunk"');
          return "tail";
        }).toString(),
      rars: (function(head, req) {
          send("bacon");
          var row;
          log("about to getRow " + typeof(getRow));
          while(row = getRow()) {
            send(row.key);
            send("eggs");
          };
          return "tail";
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

  it('it should do headers properly', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'headers'], [
        {total_rows: 1000},
        {q: 'ok'}
      ]),
      qs.list_end()
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual('start', results[0][0]);
        assertEqual(['first chunk', 'second "chunk"'], results[0][1]);
        assertEqual({headers: {'Content-Type': 'text/plain'}}, results[0][2]);
        assertEqual(['end', ['tail']], results[1]);
      });
    });
  }});

  it('show while rows', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'rars'], [
        {foo: 'bar'},
        {q: 'ok'}
      ]),
      qs.list_row({key: 'foo'}),
      qs.list_row({key: 'bar'}),
      qs.list_end()
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual('start', results[0][0]);
        assertEqual(['bacon'], results[0][1]);
        assertEqual({headers: {}}, results[0][2]);
        assertEqual(['chunks', ['foo', 'eggs']], results[1]);
        assertEqual(['chunks', ['bar', 'eggs']], results[2]);
        assertEqual(['end', ['tail']], results[3]);
      });
    });
  }});

}});
