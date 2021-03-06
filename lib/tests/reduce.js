// using a dunder because: https://github.com/jcoglan/jstest/issues/1
var __ = require('underscore');
var JS = require('jstest');
var async = require('async');
var QueryServer = require('../../lib/query_server');

JS.Test.describe("reduce", function() { with(this) {

  it('should run reduce', function(resume) { with(this) {

    var qs = QueryServer();

    var length = 100;
    // is JS.Test overriding `_`?!
    // jup: https://github.com/jcoglan/jstest/issues/1
    var kvs = __.range(length);
    async.series([
      qs.reset(),
      qs.reduce(function(keys, values, rereduce) {
        return values.length;
      }, kvs),

    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual([length], results[1]);
      });
    });
  }});

  it('should run rereduce', function(resume) { with(this) {

    var qs = QueryServer();

    var length = 10;

    // is JS.Test overriding `_`?!
    // jup: https://github.com/jcoglan/jstest/issues/1
    var kvs = __.range(length);
    async.series([
      qs.reset(),
      qs.rereduce(function(keys, values, rereduce) {
        return sum(values);
      }, kvs),

    ], function(error, results) {
      resume(function() {
        assertEqual(null, error);
        assertEqual(true, results[0]);
        assertEqual([45], results[1]);
      });
    });
  }});

}});
