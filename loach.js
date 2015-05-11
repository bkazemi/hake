var Nightmare = require('nightmare');
var cheerio = require('cheerio');
var nightmare = new Nightmare({ loadImages : false });
var site = {
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

function priceMeetsThreshold (argument) {
    // body...
}

function scrape (site, $) {
    var start = new Date(),
        end;

    nightmare
    .goto(site.departments[1].url)
    .wait(site.selectors.init)
    .scrollTo(200, 0) // in case scrolling loads more items
    .evaluate(function (site, cheerio) {
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
                    url : url ? url.getAttribute('href') : '',
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

            return JSON.stringify(mappedItems);
        }, function (items) {
            // Executed in Node scope
            console.log(items);
        }, site, cheerio
    )
    .run(function (err, nightmare) {
        if(err) {
            console.log(err);
        }
        end = new Date();
        console.log('Done in ' + (end.valueOf() - start.valueOf()) / 1000 + ' seconds.');
    });
}

/*for each site
  for each department
*/
scrape(site);

