var _ = require('underscore');
var Q = require('q');
var Nightmare = require('nightmare');
//var sitesJSON = require('./sites.json');

var nightmare = new Nightmare({ loadImages : false });
var promises = [],
    site = {
        name : 'Kmart',
        baseUrl : 'http://www.kmart.com',
        departments : [
            {
                name : 'Toys 50% discount',
                url : 'http://www.kmart.com/toys-games&50/b-20007?filter=discount&subCatView=true&viewItems=50'
            },
            {
                name : 'Home, Bed and Bath 50% discount',
                url : 'http://www.kmart.com/home-bed-bath&50/b-1348478556?filter=discount&subCatView=true&viewItems=50'
            }
        ],
        selectors : {
            next : '#bottom-pagination-next > a',
            init : '#cards-holder .card-container',
            group : '#cards-holder',
            item : {
                container : '.card-container',
                name : '.card-title a',
                url : '.card-title a',
                price : '.card-price',
                oldPrice : 'card-old-price',
                upc : '',
                dimensions : '',
                weight : ''
            }
        }
    }

function scrape (site, departmentIndex) {
    var d = Q.defer(),
        start = new Date(),
        end;

    nightmare
    .goto(site.departments[departmentIndex].url)
    .wait(site.selectors.init)
    .scrollTo(200, 0) // in case scrolling loads more items
    .evaluate(function (site, departmentIndex, d) {

        // Executed in browser scope

        var items = [],
            $next = document.querySelector(site.selectors.next),
            nextHref = '';

        var name, url, price, oldPrice, mappedItems = [];

            items = /*Array.prototype.slice.call(*/document.querySelectorAll(site.selectors.group  + ' ' + site.selectors.item.container)/*)*/;

            for (var i = items.length - 1; i >= 0; i--) {
                var item = items.item(i);
                name = item.querySelector(site.selectors.item.name);
                url = item.querySelector(site.selectors.item.url);
                price = item.querySelector(site.selectors.item.price);
                oldPrice = item.querySelector(site.selectors.item.oldPrice);
                mappedItems.push({
                    name : name ? name.textContent : '',
                    url : url ? site.baseUrl + url.getAttribute('href') : '',
                    price : price ? price.textContent : '',
                    oldPrice : oldPrice ? oldPrice.textContent : ''
                });
            };

            if($next) {
                nextHref = $next.getAttribute('href');
                if(nextHref.startsWith('/')) {
                    nextHref = site.baseUrl + nextHref;
                }
            }

            return mappedItems;
        }, function (items) {

            // Executed in Node scope

            // Done scraping, resolve promise and pass results along
            d.resolve(items);
        }, site, departmentIndex, d
    )
    .run(function (err, nightmare) {
        if(err) {
            console.log(err);
        }
        end = new Date();
        console.log('Loach done in ' + (end.valueOf() - start.valueOf()) / 1000 + ' seconds.');
    });

    return d.promise;
}

function getResults () {
    _.each(sitesJSON, function (site) {
        _.each(site.departments, function (dept, index) {
            promises.push(scrape(site, index));
        });
    });

    return Q.all(promises);
}

module.exports = function () {
    return {
        getResults : getResults
    }
}


