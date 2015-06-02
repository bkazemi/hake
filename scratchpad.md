# dev scratchpad
## The scratchpad provides some additional information pertaining to development.

## Style Guide

### Code
- Indent four (4) spaces, no tabs. Mapping tab key to 'insert 4 spaces' in IDE is recommended.
- Module level: declare global variables first, then functions.
- One 'var' declaration followed by comma-delimited list of variables.
- Opening function brace on same line as function signature.

```javascript
var a = 1,
    b = "example",
    c = { name : "Simple Object" };

function calculateSomething() {
    var value = 1,
        something = value + a;
    console.log(something);
}

calculateSomething();
```

### Git
- Short, descriptive title (50 chars max) summarizing the contents of the change.
- Followed by more detailed paragraphs describing each major part of the commit. Not needed for small commits.

```git
Update Toys R Us site.json template

Modify sites.json to reflect toysrus.com's changes to url structure and
css selectors. This is a short paragraph but it will usually be longer
because commits are usually longer and more involved than this.
But not always.
```

## server comparision

### A quick overview of the pros and cons of some server sites. All information is regarding the free plan unless otherwise noted.


### Heroku

pros: Native Node.js support, `one-off dynos' to run a script or program's console interface in the program's environment, simple interface, easy price scaling, and well documented. Pricing is also based on usage rather than a recurring fee. 

cons: no data protection, minimal hardware; 512 MB of RAM and a single CPU `share'. Most likely bottom of the barrel throughput. Closest server location is on the east coast.

### Digital Ocean ** no free plan, listing the $5/mo plan **

pros: All plans come with SSD, 1TB monthly data transfer, quick and easy setup, 1 Gbps network, simple interface, solid security, runs on KVM, featureful API. Close server location, available in San Francisco.

cons: No free plan, low hardware specs; 512 MB of RAM and a single CPU, small disk space; 20GB.

## Using common.js

### Debug('string')
The Debug constructor is used to print debugging messages to stderr, and in the future, to a log file. It works exclusively in the Node.js environment.
Debug takes one optional string argument that registers the name of the program the debugger is printing from. This is included in the debugger output.

To include it in other javascript files, you must first use the require function to bring in common.js. After it is required, you then create a new instance of Debug.
```javascript
var common = require('./common.js');
var debug = new common.Debug('example.js');
```
### Debug.prototype.set_debug(boolean, 'string' or boolean)
After you have it required, you register the debugger with the set_debug() function, included in common.js. set_debug takes two arguments. For the first argument, true allows for the debugger to print, and false disables all functionality. The second argument is used to tell where to log the debug messages. The string specifies the file to log to. A boolean is used to log to the default logname. To log to a file from the command line, the `lf' switch has been added. When using this switch, specify a filename to use relative to the CWD. If no argument is used with this switch, the default name will be used. The default can be changed by modifying the LOGDEF variable in common.js.
```javascript
common.set_debug(true); // activates the debugger
```
### Debug.prototype.log('string', 'string', boolean)
The log method is what is used to print debugging information. This method takes at most three arguments; First, a string that overrides the `freg' value (discussed later), second, the string that contains the message, and a boolean that indicates whether the first argument is a function.

If log is called with only one argument, no replacement takes place and the string argument is logged.
```javascript
debug.log('A sample debugging message');
// -> debug:: example.js: A sample debugging message
```
### Registering a function with Debug
To get the debugger to print the name of the function in the output, you register the name of the function at the beginning of each function in a variable named `freg'. This is nothing bulletproof at the moment, and may need overriding at times.
```javascript
function a()
{
    debug.freg = 'a';

    debug.log('printing from a function');
    // -> debug:: example.js: a(): printing from a function
}
```
To override a freg, you use the parameters for log described above.
```javascript
function a()
{
    // ...
    debug.log('new_name', 'freg is now replaced', true);
    // -> debug:: example.js: new_name(): freg is now replaced
}
```
This is useful if you want to print the name of a inner function without overriding freg. A simple way to print both would be to add the inner function name in the output message.
```javascript
function a()
{
    var inner = function() {
        debug.log('inner(): like this');
        // -> debug:: example.js: a(): inner(): like this
    };
}
```
