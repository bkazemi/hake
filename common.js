/* common.js - common functions */

if (   exports.LOGDEF    === undefined
    || exports.color     === undefined
    || exports.set_debug === undefined) {
    exports.LOGDEF = 'hakejs.log';
    exports.color  = require('cli-color');
    exports.set_debug = function(val, file) {
        switch (val) {
            case true  :
            case 1     :
            case 'on'  :
                exports.DEBUG = true;
                exports.Debug = function(str) {
                    this.prg = 'debug::' + (str ? ' ' + str + ': ' : ' ');
                };
                if (file) {
                    exports.DBGLOG = typeof(file) === 'string' ? file
                                   : exports.DBGLOG ? exports.DBGLOG : exports.LOGDEF;
                    exports.Debug.prototype.log = function(str, sstr, f) {
                        var fs = require('fs'),
                            buf = function(str) {
                                return fs.writeFile(exports.DBGLOG, new Buffer(str + "\n"), { flag : 'a' }, function(r){return;});
                            },
                            isf = f ? sstr ? '()' : '(): '
                                    : '';
                        if (str != null)
                            str = str.toLocaleString();
                        if (sstr != null)
                            sstr = sstr.toLocaleString();

                        if (this.freg) {
                            if (sstr) { // override freg
                                if (str)
                                    return buf(this.prg + str
                                            + isf + ': ' + sstr);
                                return buf(this.prg + sstr);
                            }
                            return buf(this.prg + this.freg + '(): ' + str);
                        }

                        if (sstr)
                            return buf(this.prg + str
                                    + isf + ': ' + sstr);

                        return buf(this.prg + str + isf); // adding isf in case sstr is an empty string
                    };
                    return exports.Debug.prototype.error = function(){};
                }
                exports.Debug.prototype.log = function(str, sstr, f) {
                    var isf = f ? sstr ? '()' : '(): '
                            : '';
                    if (str != null)
                        str = str.toLocaleString();
                    if (sstr != null)
                        sstr = sstr.toLocaleString();

                    if (this.freg) {
                        if (sstr) { // override freg
                            if (str)
                                return console.error(this.prg + str
                                        + isf + ': ' + sstr);
                            return console.error(this.prg + sstr);
                        }
                        return console.error(this.prg + this.freg + '(): ' + str);
                    }

                    if (sstr)
                        return console.error(this.prg + str
                                + isf + ': ' + sstr);

                    return console.error(this.prg + str + isf); // adding isf in case sstr is an empty string
                };
                exports.Debug.prototype.error = function(str, sstr, f) {
                    var isf = f ? sstr ? '()' : '(): '
                            : '';
                    if (str != null)
                        str = str.toLocaleString();
                    if (sstr != null && typeof(sstr) !== 'number')
                        sstr = sstr.toLocaleString();

                    var err = 'ERROR: ';
                    if (typeof(sstr) === 'number') {
                        switch (sstr) {
                        case 0 :
                            err = '';
                            break;
                        case 1 :
                            err = 'NOTE: ';
                            break;
                        case 2 :
                            err = 'WARNING: ';
                            break;
                        case 3 :
                            err = 'ERROR: ';
                            break;
                        case 4 :
                            err = 'FATAL: ';
                            break;
                        default :
                            break;
                        }
                    }
                    if (this.freg) {
                        if (sstr) { // override freg
                            if (str)
                                return console.error(exports.color.red(this.prg + err + str
                                        + isf + ': ' + sstr));
                            return console.error(exports.color.red(this.prg + err + sstr));
                        }
                        return console.error(exports.color.red(this.prg + err + this.freg + '(): ' + str));
                    }

                    if (sstr)
                        return console.error(exports.color.red(this.prg + err + str
                                + isf + ': ' + sstr));

                    return console.error(exports.color.red(this.prg + err + str + isf));
                };
                return;
            case false :
            case 0     :
            case 'off' :
            default    :
                /* override functions */
                exports.DEBUG = false;
                exports.Debug = function(){};
                exports.Debug.prototype.log = function(){};
                exports.Debug.prototype.error = function(){};
                return;
        }
        return exports.set_debug(false);
    };
}

return exports.set_debug(exports.DEBUG ? true : false);
