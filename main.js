var _ = require('underscore');
var Loach = require('./loach.js');
var loach = new Loach();
loach.getResults().then(function (results) {
    results.push(results[0]);
    results = _.flatten(results);
    console.log(results);
});