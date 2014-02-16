var isArray = require('util').isArray;
var child = require('child_process');
var EventEmitter = require('events').EventEmitter;

module.exports = function CouchJS (args) {
  var ev = new EventEmitter();

  var args = process.argv.slice(2);
  var proc = child.spawn(args[0], args.slice(1));

  var parse_qs_protocol = function(json) {
    if(json === true || json === false) {
      return json;
    }

    if(!json[0]) {
      console.log('query server protocol error: %s', json);
      return null;
    }

    if(json[0] == 'log') {
      console.log('query server log: %s', json[1]);
      return null;
    }

    if(json[0] === 'resp' && json[1]) {
      return json[1];
    }

    if(json[0] === 'error' && json[1]) {
      return json[1] + ' ' + JSON.stringify(json[2]);
    }

    if(isArray(json[0])) {
      return json;
    }

  }

  proc.on('error', function(error) {
    console.log('Error: %s', error);
  });

  proc.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
  });

  var buffer = ''
  proc.stdout.on('data', function(chunk) {
    // console.log('chunk: %s', chunk);
      buffer += chunk.toString();
      var results = buffer.split('\n')
      buffer = '';
      // todo: handle chunks that don’t parse cleanly
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
          console.log(chunk);
        }
      });

  });

  var write = function(line, callback) {
    // console.log('write: %s', line);

    if(!callback) {
      return;
    }

    ev.once('result', function(result) {
      // console.log('got result: "%j"', result);
      callback(null, result);
    });

    proc.stdin.write(line + '\n');

  };

  return {
    write: write
  }
};
