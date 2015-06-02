/* sieve.js - start program */

var common = require('./common.js');

if (process.argv[2])
    for (var i = 2; i < process.argv.length; i++) {
        switch (process.argv[i]) {
            case '-h' :
                usage();
            case '-d' :
                common.set_debug(true);
                break;
            case '-lf' :
                process.argv[++i] ? process.argv[i][0] !== '-' ?
                    common.set_debug(true, process.argv[i++])
                    : common.set_debug(true, true)
                : common.set_debug(true, true);
                break;
            default :
                console.log('unrecognized option: `' + process.argv[i] + "'");
                process.exit(1);
        }
    }

function usage()
{
    console.log('sieve.js - A FBA scraper\n\n' +
                'usage: node ' + process.argv[1] + ' [options]\n\n' +
                'options:\n' +
                '-d           turn on debugging\n' +
                '-lf  [file]  log debug messages to file\n' +
                '-h           this info'
               );
    process.exit(0);
}

var shovelnose = require('./shovelnose.js'), // needs to be require'd after for set_debug to kick in
    dbg = new common.Debug('sieve.js');

shovelnose.then(function(r) {
    dbg.log('ret', r);
    process.exit(0);
});
