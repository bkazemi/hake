# Sieve
## FBA Web Scraper

### Phase 1 : Loach

Loach scrapes sites such as Kmart, Target, and Toys R Us to find discounted items that could potentially have good profit margins on Amazon. It uses [NightmareJS](https://github.com/segmentio/nightmare) as the scraping engine (this might change to regular [PhantomJS](https://github.com/ariya/phantomjs) if Nightmare is too simplified for our use).

Websites to scrape are defined in sites.json in the following format

```json
[
    {
        "name" : "Kmart",
        "baseUrl" : "http://www.kmart.com",
        "departments" : [
            {
                "name" : "Toys 50% discount",
                "url" : "http://www.kmart.com/toys-games&50/b-20007?filter=discount&subCatView=true&viewItems=50"
            },
            {
                "name" : "Home, Bed and Bath 50% discount",
                "url" : "http://www.kmart.com/home-bed-bath&50/b-1348478556?filter=discount&subCatView=true&viewItems=50"
            }
        ],
        "selectors" : {
            "next" : "#bottom-pagination-next > a",
            "init" : "#cards-holder .card-container",
            "group" : "#cards-holder",
            "item" : {
                "container" : ".card-container",
                "name" : ".card-title a",
                "url" : ".card-title a",
                "price" : ".card-price",
                "oldPrice" : "card-old-price",
                "upc" : "",
                "dimensions" : "",
                "weight" : """
            }
        }
    }
]
```

Loach exports JSON that is an array of objects representing promising products to investigate on Amazon.

```json
[
    {
        "name" : "Product Name",
        "url" : "http://www.example.com/product",
        "price" : 12.99,
        "oldPrice" : 34.99
    }
]
```

### Phase 2 : Shovelnose

Shovelnose takes Loach's exported JSON as input and looks at the products' listings on Amazon to determine if any are worth purchasing.

Amazon will be picked through using NightmareJS to search for the items that Loach feeds to Shovelnose. Once an item has been searched for, if there are results on Amazon, Shovelnose will store a temporary object to hold the products' information. The first thing stored in this object is the result's ASIN. Shovelnose then takes the ASIN to look for the product's personal page. This page will then be sorted through to find the item's price. If the price is low enough, Shovelnose will continue searching for the Amazon ranking and dimensions. If the Amazon ranking is low enough, this rank is given it's own ranking. This preference will be able to be set by the user in a future release. After collecting necessary information for the item, Shovelnose then appends the temporary object's properties to the object provided by Loach. When all items are processsed, Shovelnose returns a JSON string structurally the same as Loach's, with the additional information shown below. The format for such follows in this example:

```json
[
    {
        "(Loach properties)" : "...",
        "asin" : "ABC123",
        "AMZname" : "Example toy",
        "AMZprice" : 10.00,
        "AMZdimensions" : "5 ounces",
        "AMZupc" : "a long number",
        "AMZrank" : "#1 in Toys & Games",
        "AMZrankIs" : "ideal"
    }
]
```

If Shovelnose fails to get any of this information, with the exception of the UPC, it will remove the item from the array.
