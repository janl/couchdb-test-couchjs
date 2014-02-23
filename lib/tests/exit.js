var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("exit", function() { with(this) {

  before(function(resume) { with(this) {
    this.qs = QueryServer();

    this.ddoc = this.qs.make_ddoc({
      lists: {
        capped: (function(head, req) {
          send("bacon")
          var row, i = 0;
          while(row = getRow()) {
            send(row.key);
            i += 1;
            if (i > 2) {
              return('early');
            }
          };
        }).toString(),
        raw: (function(head, req) {
          send("first chunk");
          send(req.q);
          var row;
          while(row = getRow()) {
            send(row.key);
          };
          return "tail";
        }).toString()
      },
      shows: {
        fatal: (function() {
          throw(["fatal","error_key","testing"]);
        }).toString()
      }
    });
    this.qs.teach_ddoc(this.ddoc)(resume);
  }});

  after(function(resume) { with(this) {
    qs.close();
    resume();
  }});

  it('should exit ißf erlang sends too many rows', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'capped'], [
        {foo: 'bar'},
        {q: 'ok'}
      ]),
      qs.list_row({key: 'foo'}),
      qs.list_row({key: 'bar'}),
      qs.list_row({key: 'baz'}),
      qs.list_row({key: 'qux'})
    ], function(error, results) {
      assertEqual(null, error);
      assertEqual('start', results[0][0]);
      assertEqual(['bacon'], results[0][1]);
      assertEqual({headers: {}}, results[0][2]);
      assertEqual(['chunks', ['foo']], results[1]);
      assertEqual(['chunks', ['bar']], results[2]);
      assertEqual(['end', ['baz', 'early']], results[3]);
      assertEqual('error', results[4][0]);
      assertEqual('unknown_command', results[4][1]);
      assertEqual('unknown command \'list_row\'', results[4][2]);
      qs.exited(function() {
        assert(true);
        resume();
      });
    });
  }});

  it('should exit if it gets a non-row in the middle', function(resume) { with(this) {

    async.series([
      qs.list(ddoc, ['lists', 'raw'], [
        {foo: 'bar'},
        {q: 'ok'}
      ]),
      qs.reset()
    ], function(error, results) {
      assertEqual(null, error);
      assertEqual('start', results[0][0]);
      assertEqual(['first chunk', 'ok'], results[0][1]);
      assertEqual({headers: {}}, results[0][2]);
      assertEqual('error', results[1][0]);
      assertEqual('list_error', results[1][1]);
      qs.exited(function() {
        assert(true);
        resume();
      });
    });
  }});

  it('should exit on a fatal error', function(resume) { with(this) {

    qs.show(ddoc, {foo: 'bar'}, 'fatal')(function() {
      qs.exited(function() {
        assert(true);
        resume();
      });
    });
      
  }});

}});
