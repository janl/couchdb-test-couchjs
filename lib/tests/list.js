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
      rows: (function(head, req) {
          send("first chunk");
          send(req.q);
          var row;
          log("about to getRow " + typeof(getRow));
          while(row = getRow()) {
            send(row.key);
          };
          return "tail";
        }).toString(),
      buffer_chunks: (function(head, req) {
          send("bacon");
          var row;
          log("about to getRow " + typeof(getRow));
          while(row = getRow()) {
            send(row.key);
            send("eggs");
          };
          return "tail";
        }).toString(),
      chunky: (function(head, req) {
          send("first chunk");
          send(req.q);
          var row, i=0;
          while(row = getRow()) {
            send(row.key);
            i += 1;
            if (i > 2) {
              return('early tail');
            }
          };
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

  it('should handle show with rows', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'rows'], [
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
        assertEqual(['first chunk', 'ok'], results[0][1]);
        assertEqual({headers: {}}, results[0][2]);
        assertEqual(['chunks', ['foo']], results[1]);
        assertEqual(['chunks', ['bar']], results[2]);
        assertEqual(['end', ['tail']], results[3]);
      });
    });
  }});

  it('should work with zero rows', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'rows'], [
        {foo: 'bar'},
        {q: 'ok'}
      ]),
      qs.list_end()
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual('start', results[0][0]);
        assertEqual(['first chunk', 'ok'], results[0][1]);
        assertEqual({headers: {}}, results[0][2]);
        assertEqual(['end', ['tail']], results[1]);
      });
    });
  }});

  it('should buffer chunks from multiple sends', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'buffer_chunks'], [
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

  it('should end after two', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'chunky'], [
        {foo: 'bar'},
        {q: 'ok'}
      ]),
      qs.list_row({key: 'foo'}),
      qs.list_row({key: 'bar'}),
      qs.list_row({key: 'baz'}),
      qs.reset()
    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual('start', results[0][0]);
        assertEqual(['first chunk', 'ok'], results[0][1]);
        assertEqual({headers: {}}, results[0][2]);
        assertEqual(['chunks', ['foo']], results[1]);
        assertEqual(['chunks', ['bar']], results[2]);
        assertEqual(['end', ['baz', 'early tail']], results[3]);
        assertEqual(true, results[4]);
      });
    });
  }});

}});
