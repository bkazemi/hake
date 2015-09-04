/* loach.js - get information from sites listed in sites.json */

var _         = require('underscore')                 ,
    Q         = require('q')                          ,
    Nightmare = require('nightmare')                  ,
    sitesJSON = require('./sites.json')               ,
    common    = require('./common.js')                ,
    dbg       = new common.Debug('loach.js')          ,
    nightmare = new Nightmare({ loadImages : false }) ,
    promises  = []                                    ;

function scrape(site, dept) {
    var d = Q.defer();
    dbg.freg = 'scrape';

    nightmare
    .goto(dept.url)
    .wait(site.selectors.init)
    .scrollTo(200, 0) // in case scrolling loads more items
    .evaluate(function(site, dept, d) {

        /* - Executed in browser scope - */

        var name, url, price, oldPrice, mapped_items = [], itemslen
            items = document.querySelectorAll(site.selectors.group + ' '
                                              + site.selectors.item.container);
            if (!(itemslen = items.length))
                return null;
            for (var i = 0; i < itemslen; i++) {
                var item = items.item(i);
                name = (name = item.querySelector(site.selectors.item.name)) ?
                    name.textContent : '';
                /* always assume that if there is an href prop that we want that */
                url = (url = item.querySelector(site.selectors.item.url)) ?
                    (url.href ? url.href : url.textContent) : '';
                p = (p = item.querySelector(site.selectors.item.price)) ?
                    p.textContent : '';
                oldp = (oldp = item.querySelector(site.selectors.item.oldPrice)) ?
                    oldp.textContent : '';
                mapped_items.push({
                    name     : name ,
                    url      : url  ,
                    price    : p    ,
                    oldPrice : oldp ,
                });
            };

            return mapped_items;
        }, function(items) {
            /*
             * - Executed in Node scope -
             * Done scraping, resolve promise and pass results along
             */
            d.resolve(items);
            if (!items)
                dbg.error('items query failed for '+site.name + ' - dept: `'+dept.name+"'");
            else
                dbg.log(site.name + ' - dept: ' + '`'+dept.name+"'" + ' processed successfully');
        }, site, dept, d)
    .run(function(err, nightmare) {
        if (err) {
            dbg.log(err);
            throw err;
        }
    });

    return d.promise;
}

function getResults() {
    sitesJSON.forEach(function(site) {
        site.departments.forEach(function(dept) {
            promises.push(scrape(site, dept));
        });
    });

    return Q.all(promises);
}

module.exports = function() {
    return {
        getResults : getResults
    }
}
