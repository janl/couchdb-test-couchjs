var isArray = require('util').isArray;
var child = require('child_process');
var EventEmitter = require('events').EventEmitter;

module.exports = function CouchJS (args) {
  var ev = new EventEmitter();

  var args = process.argv.slice(2);
  var proc = child.spawn(args[0], args.slice(1));

  proc.on('error', function(error) {
    console.log('Process error: %s', error);
  });

  proc.stderr.on('data', function(data) {
    console.log('Process stderr: ' + data);
  });


  // parse JSON responses from the query server
  var parse_qs_protocol = function(json) {

    // handle errors
    if(json[0] === 'error') {
      return json;
    }

    // handle boolean results
    if(json === true || json === false) {
      return json;
    }

    // some boolean results are encoded in 0 and 1
    if(json === 1 || json === 0) {
      return json;
    }

    // handle exception objects
    if((typeof json == 'object') && !json.length) {
      return json;
    }

    // if we don’t get a first array member in the result,
    // something is seriously amiss. Report and carry on.
    if(!json[0]) {
      console.log('query server protocol error: %j', json);
      return null;
    }

    // the query server asked us to log. Let’s log and
    // carry on.
    if(json[0] == 'log') {
      //console.log('query server log: %s', json[1]);
      return null;
    }

    // handle regular responses
    if(json[0] === 'resp' && json[1]) {
      return json[1];
    }

    // handle updates
    if(json[0] === 'up' && json[1]) {
      return json.slice(1);
    }

    // handle lists
    if(json[0] === 'start') {
      return json;
    }

    // more lists
    if(json[0] === 'chunks') {
      return json;
    }

    // end lists
    if(json[0] === 'end') {
      return json;
    }

    if(json[0] === true) {
      return json[1];
    }

    // handle result sets
    if(isArray(json[0])) {
      return json;
    }

    console.log('query server parse error: %j', json);
    return null;
  }

  /*
    This one is a bit gnarly, but here is how it works:

    For each `write(cmd)` call, we need to return the correct
    result that matches the `cmd`.

    In order to do so, we rely on a few things: stdio is ordered,
    e.g. if I send requests in order 1, 2, 3, I get responses back
    in the order 1, 2, 3. Even if the reqeusts 1 and 2 might run in
    parallel.

    In order to be able to capture results that are larger than
    a single `chunk`, we need to buffer responses. This is an easy
    fix, but leads to another complication: now our buffer could
    hold the results for multiple requests.

    The solution is to split the buffer by \n and work through all
    resulting sub-chunks in order.

    TODO: with larger results, we might get chunks that don’t parse
    cleanly past the last \n (e.g. `true\ntrue\ntru`). To fix this,
    we need to keep reading chunks until `JSON.parse()` succeeds.
    // line 104 supposedly does this, but we need to test it once
    // we get to larger responses.
  */
  var buffer = ''
  proc.stdout.on('data', function(chunk) {
     // console.log('chunk: %s', chunk);
      buffer += chunk.toString();
      var results = buffer.split('\n')
      buffer = '';
      // todo: handle chunks that don’t parse cleanly on either side of \n
      results.forEach(function(result) {
        if(result === '') { return; }
        try {
          var json = JSON.parse(result);
          var parsed_result = parse_qs_protocol(json)
          if(parsed_result !== null) {
            // ignore log commands
            // console.log('emit "%s"', parsed_result);
            ev.emit('result', parsed_result);
          }
        } catch (e) {
          //ignore, try on next chunk
          console.log('parse error: "%s" in "%s"', e, result);
          console.log(result);
          buffer = result; // try again
        }
      });

  });

  // write to the process’s stdin and wait for results
  var write = function write(line, callback) {
    // console.log('write: %s', line);

    if(!callback) {
      // ignore results if we don’t have a callback
      return;
    }

    // wait for exactly one result and then stop
    // listening. This ensures that the each
    // `write()` call gets the correct result back
    ev.once('result', function(result) {
      callback(null, result);
    });

    proc.stdin.write(line + '\n');
  };

  var close = function close(callback) {
    proc.disconnect();
    ev.once('disconnect', function() {
      callback(null);
    });
  };

  var exited = function(callback) {
    proc.on('exit', function() {
      callback();
    });
  };

  return {
    write: write,
    close: close,
    exited: exited
  }
};
