/* shovelnose.js - pass item(s) to amazon */

var Nm     = require('nightmare')  ,
    _      = require('underscore') ,
    Q      = require('q')          ,
 //------------------------------------------------------
    Loach  = require('./loach.js') ,
    loach  = new Loach()           ,
 //------------------------------------------------------
    common = require('./common.js')            ,
    dbg    = new common.Debug('shovelnose.js') ,
 /*-----------------------------------------------------*
  * function specific variables that need global scope  *
  *-----------------------------------------------------*/
    first  = true, items, pnmq = Q.defer() ;

var Search = function(multi, arr, lastidx) {
    this.first = true;
    this.searchq = Q.defer();
    this.nm = new Nm({ loadImages : false });
    if (multi) {
        this.multi = multi;
        this.arr = arr;
        this.arridx = 0;
        this.last = lastidx;
    }
};
Search.prototype.instance = function(item) {
    dbg.freg = 'search';
    var t = this;

    if (item !== undefined) {
        t.nm
        .useragent // ensure no mobile page
         ('Mozilla/5.0 (X11; Linux x86_64; rv:37.0) Gecko/20100101 Firefox/37.0')
        .goto('http://www.amazon.com')
        .type('input[id="twotabsearchtextbox"]', item.name)
        .click('input[value="Go"]')
        .wait('#atfResults')
        .evaluate(function(item, t) {
            if (document.querySelector('#noResultsTitle')) // item not found
                return null;
            /* get first result */
            var pr = document.querySelector('#s-results-list-atf').childNodes[0],
                asin;
            if (pr.textContent.trimLeft().substr(0,(26 + item.name.length))
                    === 'Video shorts related to "' + item.name + '"')
                pr = pr.parentNode.childNodes[1]; // first result was video container, skip it
            return asin = pr.getAttribute('data-asin') || '';
            }, function(ret) {
                if (ret) {
                    dbg.log('search for item: `' + item.name + "' successful");
                    return item.asin = ret;
                }
                dbg.log('search for item: `' + item.name + "' unsuccessful");
                return items[t.tmpidx = items.indexOf(item)] = null;
            }, item)
            .run(function(err, nm) {
                if (err) {
                    dbg.log(err);
                    throw err;
                }
                /* search was successful, continue to individual page */
                if (item.asin) {
                    nm
                    .useragent // ensure no mobile page
                     ('Mozilla/5.0 (X11; Linux x86_64; rv:37.0) Gecko/20100101 Firefox/37.0')
                    .goto('http://www.amazon.com/dp/' + item.asin)
                    .wait('#productTitle')
                    .evaluate(function(item, t) {
                        var retobj = {},
                            new_prod_format = false;
                        var name = document.querySelector('#productTitle')
                                || document.querySelector('#btAsinTitle')
                                || null;
                        if (name)
                            retobj.AMZname = name.textContent;
                        else
                            return 'failed at name query';
                        var price = document.querySelector('#priceblock_ourprice') // regular format
                            || document.querySelector('#priceblock_saleprice') // sale
                            || document.querySelector('#actualPriceValue') // large price
                            || null;
                        if (price) {
                            price = parseFloat(price.textContent.replace('$', ''));
                            item.price = parseFloat(item.price.toLocaleString().replace('$',''));
                            retobj.AMZprice = price;
                        } else {
                            return 'failed at price query';
                        }
                        if ((price / item.price) >= 3) { // good, get rest of info
                            var details = document.querySelector('#detail-bullets'),
                                rankquery;
                            if (!details) {
                                details = document.querySelector('#prodDetails'); // new product format
                                if (!details) return 'failed at detail query';
                                new_prod_format = true;
                            }
                            if (rankquery = details.querySelector('#SalesRank')) {
                                /* replace module gets rid of `(See Top 100 in ...)' */
                                var rank = /(#\d+).*(\s.*)in.*/.exec(rankquery.textContent)[0].replace(/\s*\(.*\)/, '');
                                if (rank)
                                    retobj.AMZrank = rank;
                                else
                                    return 'failed at rank regexp';
                            } else {
                                return '2failed at sales rank query';
                            }

                            var rankranking = parseInt(/#(\d+,?)+/.exec(rank)[0].replace(/[#,]/g,''));
                            if (rankranking) {
                                if (rankranking < 5e4)
                                    retobj.AMZrankIs = 'ideal';
                                else if (rankranking < 1e5)
                                    retobj.AMZrankIs = 'good';
                                else if (rankranking < 2e5)
                                    retobj.AMZrankIs = 'fair';
                                else
                                    return 'toss'; // toss it
                            } else {
                                return 'failed at rankranking regexp';
                            }
                        } else {
                            return 'failed at price division';
                        }
                        if (new_prod_format) {
                            var key;
                            if (!(key = details.getElementsByClassName('label')))
                                return 'failed to get labels';
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
                        var dim = details.getElementsByTagName('li');
                        if (dim)
                            for (var i = 0; i < dim.length; i++) {
                                if (dim[i].textContent.match('Product Dimensions:')) {
                                    retobj.AMZdimensions = /\d.+/.exec(dim[i].textContent)[0]
                                    return retobj;
                                } else if (dim[i].textContent.match('Shipping Weight')) {
                                    retobj.AMZdimensions += /^.*\d+ \w+/.exec(dim[i].textContent)[0];
                                    return retobj;
                                }
                            }
                        return 'failed at end';
                    }, function(fate) {
                        if (fate) {
                            if (fate === 'toss') {
                                return item = items[t.tmpidx = items.indexOf(item)] = null;
                            } else if (typeof fate === 'string') {
                                /* XXX is there a cleaner way to do this? */
                                var lore = fate === 'failed at price division' ? 'log' : 'error',
                                    level = lore === 'error' ? (Number(fate[0]) || 3) // may not specify level 3 in str
                                          : ''
                                dbg[lore]('`' + item.name + "'" + ' nightmare .eval() ' +
                                    ((Number(level) && level !== 3) ? fate.substr(1) : fate) , level);
                                return item = items[t.tmpidx = items.indexOf(item)] = null;
                            }
                            detkeys = Object.keys(fate);
                            for (var i = 0; i < detkeys.length; i++)
                                item[detkeys[i]] = fate[detkeys[i]];
                            return fate;
                        }
                        dbg.error('failed to get info of item `' + item.name + "'");
                        return item = items[t.tmpidx = items.indexOf(item)] = null;
                    }, item)
                    .run(function(err) {
                        if (err)
                            throw err;
                        if (item) {
                            dbg.log('successfully processed item: `' + item.name + "'");
                            t.tmpidx = items.indexOf(item);
                        }
                        /* find subsequent items recursively */
                        if (t.multi) {
                            var next = process_next_multi(null, null, t.tmpidx,
                                                          t.arridx === t.last,
                                                          items.indexOf(t.arr[t.arridx+1]));
                            if (next) {
                                ++t.arridx;
                                return t.instance(next);
                            }
                            return t.searchq.resolve();
                        }
                        var next = process_next(null, t.tmpidx);
                        if (next)
                            return t.instance(next);
                        return t.searchq.resolve(JSON.stringify(items));
                    });
                    return;
                }
                /* add recursion outside of if blk in case last item's search is unsuccessful */
                if (t.multi) {
                    var next = process_next_multi(null, null, t.tmpidx,
                                                  t.arridx === t.last,
                                                  items.indexOf(t.arr[t.arridx+1]));
                    if (next) {
                        ++t.arridx;
                        return t.instance(next);
                    }
                    return t.searchq.resolve();
                }
                var next = process_next(null, t.tmpidx);
                if (next)
                    return t.instance(next);
                return t.searchq.resolve(JSON.stringify(items));
           });
           if (this.first) {
               this.first = !this.first;
               return this.searchq.promise;
           } else {
               return;
           }
    } else {
        /* shouldn't get here */
        dbg.error('fell through, something went wrong', 4);
        return this.searchq.resolve(null);
    }
};

function process_next(init, idx)
{
    if (init) {
        if (!init.length) {
            dbg.error('loach returned NULL', 4);
            return null;
        }
        var promises = [];
        items = init,
        promises.push(new Search(false, null).instance(items[0]));
        return Q.all(promises);
    }

    if (!items[idx]) {
        items.splice(idx, 1);
        return items[idx] ? items[idx] : null;
    }

    return items[++idx] ? items[idx] : null;
}

function process_next_multi(num, init, idx, islast, nextidx)
{
    if (init) {
        if (!init.length) {
            dbg.error('loach returned NULL', 4);
            return null;
        }
        if (num > init.length) {
            console.error('too many instances requested!');
            return null;
        }
        var promises = [];
        items = init;
        for (var i = 0; i < num; i++)
            this['nmarr' + i] = [];
        for (i = 0; i < init.length; i += num)
            for (var j = 0; j < num; j++)
                if (i+j < init.length)
                    this['nmarr' + j].push(init[i+j]);
        for (i = 0; i < num; i++)
            promises.push((new Search(true, this['nmarr' + i], this['nmarr' + i].length-1))
                                   .instance(this['nmarr' + i][0]));
        promises.push(pnmq.promise);

        return Q.all(promises);
    }

    return !islast ? items[nextidx]
    : items[++idx] !== undefined ? null
      : function() {
            pnmq.resolve();
            return null;
      }();
}

function getResults(num)
{
    if (num > 1) {
        return loach.getResults()
               .then(function(results) {
                   var res = _.flatten(results);
                   return process_next_multi(num, res).then(function() {
                      var i = 0, itemslen = items.length;
                      while (i < itemslen) {
                          if (!items[i]) {
                              items.splice(i, 1);
                              --itemslen;
                              continue;
                          }
                          ++i;
                      }
                      return JSON.stringify(items);
                  });
              });
    }
    return loach.getResults()
           .then(function(results) {
               var res = _.flatten(results);
               return process_next(res);
          });
}

module.exports = function() {
    return { getResults : getResults };
};
