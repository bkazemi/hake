/* hake.js - start program */

var common    = require('./common.js'),
    instances = null,
    inum      = null;

if (process.argv[2]) {
    for (var i = process.argv.length-1; i >= 2; --i)
        switch (process.argv[i]) {
            case '-h' :
                usage();
            case '-V' :
                version();
        }
    for (i = 2; i < process.argv.length; i++) {
        if (/^-i[0-9]+$/.exec(process.argv[i])) {
            inum = process.argv[i].substr(2);
            process.argv[i] = '-i';
        }
        switch (process.argv[i]) {
            case '-d' :
                common.set_debug(true);
                break;
            case '-i' :
                instances = parseInt(inum ? inum : process.argv[++i]);
                if (!instances && instances !== 0)
                    return console.log('`-i\' requires a number');
                else if (instances < 1)
                    return console.log('invalid number for `-i' + "'");
                break;
            case '-lf' :
                process.argv[++i] ? process.argv[i][0] !== '-' ?
                    common.set_debug(true, process.argv[i++])
                    : common.set_debug(true, true)
                : common.set_debug(true, true);
                break;
            default :
                console.log('invalid option: `' + process.argv[i] + "'");
                process.exit(1);
        }
    }
}

function usage()
{
    console.log('hake.js - An FBA scraper\n\n' +
                'usage: node ' + process.argv[1].replace(/.*\//,'') + ' [options]\n\n' +
                'options:\n' +
                '-d             turn on debugging\n' +
                '-lf  [file]    log debug messages to file\n' +
                '-i   <number>  specify Nightmare instances\n' +
                '-V             show version info\n' +
                '-h             this info'
               );
    process.exit(0);
}

function version()
{
    console.log('hake-0.1.0\n' +
                '© 2015 Bijan & Cyrus Kazemi-Shirkadeh\n' +
                '<{b,cyrus}@shirkadeh.org>'
               );
    process.exit(0);
}

var Shovelnose = require('./shovelnose.js'), // needs to be require'd after for set_debug to kick in
    shovelnose = new Shovelnose(),
    dbg        = new common.Debug('hake.js');

shovelnose.getResults(instances).then(function(r) {
    dbg.log('ret', r);
    process.exit(0);
});
