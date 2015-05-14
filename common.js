/* common.js - common functions */

exports.LOGDEF = 'sievejs.log';
exports.set_debug = function(val, file) {
    switch (val) {
        case true  :
        case 1     :
        case 'on'  :
            exports.DEBUG = true;
            exports.Debug = function(str) {
                if (str)
                    this.prg = 'debug:: ' + str 
                        + ': ';
                else
                    this.prg = 'debug:: ';
            };
            if (file) {
                typeof(file) === 'string' ? exports.DBGLOG = file
                    : exports.DBGLOG ? true : exports.DBGLOG = exports.LOGDEF;
                exports.Debug.prototype.log = function(str, sstr, f) {
                    var isf, fs = require('fs'),
                        buf = function(str) {
                            return fs.writeFile(exports.DBGLOG, new Buffer(str + "\n"), { flag : 'a' }, function(r){return;});
                        }
                    f ? isf = '()' : isf = '';
    
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
    
                    return buf(this.prg + str);
                };
                return;
            }
            exports.Debug.prototype.log = function(str, sstr, f) {
                var isf;
                f ? isf = '()' : isf = '';
    
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
    
                return console.error(this.prg + str);
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
            return;
    }
    return exports.set_debug(false);
};
if (exports.DEBUG)
        return exports.set_debug(true);
return exports.set_debug(false);
