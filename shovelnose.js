/* shovelnose.js - pass item(s) to amazon */

var Nm     = require('nightmare'),
    nm     = new Nm({ loadImages : false }),
    //-------------
    _      = require('underscore'),
    Q      = require('q'),
    //-------------
    Loach  = require('./loach.js'),
    loach  = new Loach(),
    //-------------
    common = require('./common.js'),
    dbg    = new common.Debug('shovelnose.js'),
    //-------------
    first  = true, items, i; // function specific variables

module.exports = 
loach.getResults().then(function(results) {
    var res = _.flatten(results);
    return process_next(res);
});

function search(item, searchq)
{
    dbg.freg = 'search';
    if (first)
        var searchq = Q.defer();

    if (item !== undefined) {
        nm
        .goto('http://www.amazon.com')
        .type('input[id="twotabsearchtextbox"]', item.name)
        .click('input[value="Go"]')
        .wait()
        .evaluate(function(item, searchq) {
            if (document.querySelector('#noResultsTitle')) // item not found
                return null;
            /* get first result*/
            var pr = document.querySelector('#s-results-list-atf').childNodes[0],
                asin;
            if (pr.textContent.trimLeft().substr(0,(26 + item.name.length))
                    === 'Video shorts related to "' + item.name + '"')
                pr = pr.parentNode.childNodes[1]; // first result was video container, skip it
            asin = pr.getAttribute('data-asin') || '';
            return asin;
            }, function(ret) {
                   if (ret) {
                       dbg.log('search for item: `' + item.name + '\' successful');
                       item.asin = ret;
                       return;
                   } 
                   dbg.log('search for item: `' + item.name + '\' unsuccessful');
                   return items[items.indexOf(item)] = null;
            }, item)
            .run(function(err, nm) {
                if (err) {
                    dbg.log(err);
                    throw err;
                }
                if (item.asin) {
                    /* search was successful, continue to individual page */
                    nm
                    .useragent('Mozilla/5.0 (X11; Linux x86_64; rv:37.0) Gecko/20100101 Firefox/37.0') // ensure no mobile page
                    .goto('http://www.amazon.com/dp/' + item.asin)
                    .wait()
                    .evaluate(function(item) {
                        var name, retobj = {};
                        if (name = document.querySelector('#productTitle'))
                            retobj.AMZname = name.textContent;
                        else if (name = document.querySelector('#btAsinTitle'))
                            retobj.AMZname = name.textContent;
                        else
                            return null;
                        var price;
                        if (price = document.querySelector('#priceblock_ourprice')) // regular format
                            retobj.AMZprice = price.textContent;
                        else if (price = document.querySelector('#priceblock_saleprice')) // sale
                            retobj.AMZprice = price.textContent;
                        else if (price = document.querySelector('#actualPriceValue')) // large price
                            retobj.AMZprice = price.textContent;
                        else
                            return 'fails at price query';
                        price = price.textContent.replace('$', '');
                        typeof(item.price) === 'string' ?
                            item.price = item.price.replace('$', '')
                            : item.price = item.price.toLocaleString().replace('$', '');
                        if ((price / item.price) >= 3) { // good, get rest of info
                            var rank, details = document.querySelector('#detail-bullets'); 
                            if (!details) {
                                details = document.querySelector('#prodDetails'); // new product format
                                if (!details) return 'fails at detail query';
                                var d2 = true;
                            }
                            retobj.AMZprice = price;
                            if (rank = details.querySelector('#SalesRank')) {
                                var match;
                                if (match = rank.textContent.match(/(#\d+).*(\s.*)in.*/g)) {
                                    for (var i = 0; i < match.length; i++) {
                                        match[i] = match[i].replace(/\(.*\)/, ''); // get rid of `(See Top 100 in ...)'
                                        match[i] = match[i].replace(/[^(.*\d)]\s*in/, ' in');
                                        match[i].trimRight().trimLeft();
                                    }
                                    retobj.AMZrank = match.join(' ');
                                } else
                                    return 'fails at rank regexp';
                            }
                            var rankranking;
                            if (rank && (rankranking = match[0].match(/#(\d+,?)+/)[0].toLocaleString().substr(1))) {
                                rankranking = rankranking.replace(/,/g,'');
                                if (rankranking < 50000)
                                    retobj.AMZrankIs = 'ideal';
                                else if (rankranking < 100000)
                                    retobj.AMZrankIs = 'good';
                                else if (rankranking < 200000)
                                    retobj.AMZrankIs = 'fair';
                                else
                                   return 'toss'; // toss it
                            } else
                                return 'fails at rankranking regexp';
                        } else
                            return 'fails at price division';
                        if (d2) {
                            var key;
                            if (!(key = details.getElementsByClassName('label')))
                                return 'fails to get labels';
                            retobj.AMZdimensions = '';
                            for (var i = 0; i < key.length; i++) {
                                switch (key[i].textContent) {
                                    case "Product Dimensions" :
                                        retobj.AMZdimensions = key[i].parentNode.querySelector('td.value').textContent;
                                        break;
                                    case "UPC" :
                                        retobj.AMZupc = key[i].parentNode.querySelector('td.value').textContent;
                                        break;
                                    case "Shipping Weight" :
                                        var val = key[i].parentNode.querySelector('td.value').textContent;
                                        val = ' ' + key[i].textContent + ' ' + val.replace(/\(.*\)/, '').trimRight();
                                        retobj.AMZdimensions += val;
                                        break;
                                }
                            }
                            if (!retobj.AMZdimensions)
                                return 'failed to get dimensions in product table';
                            return retobj;
                        }
                        var dim;
                        if (dim = details.getElementsByTagName('li')) 
                            for (var i = 0; i < dim.length; i++) {
                                if (dim[i].textContent.match('Product Dimensions:')) {
                                    retobj.AMZdimensions = /\d.+/.exec(dim[i].textContent)[0]
                                    return retobj;
                                }
                                else if (dim[i].textContent.match('Shipping Weight')) {
                                    retobj.AMZdimensions += /^.*\d+ \w+/.exec(dim[i].textContent)[0];
                                    return retobj;
                                }
                            }
                        return 'fails at end';
                    }, function(det) {
                        if (det) {
                            if (det === 'toss') {
                                items[items.indexOf(item)] = null;
                                return item = null;
                                }
                            else if (typeof det === 'string') {
                                dbg.log('`' + item.name + "'" + ' nightmare .eval', det, true);
                                items[items.indexOf(item)] = null;
                                return item = null;
                            }
                            detkeys = Object.keys(det);
                            for (var i = 0; i < detkeys.length; i++)
                                item[detkeys[i]] = det[detkeys[i]];
                            return det;
                        }
                        dbg.log('failed to get info of item `' + item.name + "'");
                        items[items.indexOf(item)] = null;
                        return item = null;
                    }, item)
                    .run(function(err, nm) {
                        if (err)
                            throw err;
                        if (item) dbg.log('successfully processed item: `' + item.name + "'");
                        /* find subsequent items recursively */
                        var next;
                        if (next = process_next())
                            return search(next, searchq);
                        searchq.resolve(JSON.stringify(items));
                    });
                    return;
                }
                /* add recursion outside of if blk in case last item's search is unsuccessful */
                var next;
                if (next = process_next())
                    return search(next, searchq);
                searchq.resolve(JSON.stringify(items));
           });
           if (first) {
               first = !first; 
               return searchq.promise;
           } else
                 return;
    } else {
          dbg.log('loach returned NULL');
          return searchq.resolve(null);
    }
}

function process_next(init)
{
    if (init) {
        var promises = []; 
        items = init, i = 0,
        promises.push(search(items[i]));
        return Q.all(promises);
    }
    if (!items[i]) {
        items.splice(i, 1);
        return items[i] ? items[i] : null;
    }
    return items[++i] ? items[i] : null;
}
