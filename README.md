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

Phase 2 : Bijan gets to pick name (bottom feeder fish such as Bream, Haddock, Pleco, Shovelnose, etc.)

Phase 2 takes in Loach's exported JSON as input and looks at the potential products' listings on Amazon to determine if they are worth purchasing.

** Bijan to add notes here regarding implementation details, selection process (3x price multiple, sales rank), and export format. **

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
