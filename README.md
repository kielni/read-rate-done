# Read rated done

[Chrome extension](https://chrome.google.com/webstore/detail/cffdboojhkfgkeicaeckflcbjokpekih) to set read date and rate a book on [Goodreads](https://www.goodreads.com) from [Kindle Cloud Reader](https://read.amazon.com).

I use Goodreads to keep track of books I've read.  I want to record two simple things:
- approximately when I read a book
- a rating

This is much harder than it should be:

Rating from a Kindle doesn't set the read date at all.

From the Android app, it's
[8 steps](https://www.goodreads.com/help/show/288-how-do-i-set-a-book-s-date-read-on-the-android-app) (!)
to set a read date.

It's possible from a desktop browser, but involves a search for the book, clicking a dropdown, clicking Read, waiting for a popup, clicking a rating, clicking a button to set the read date to today, and saving.

This extension injects stars below the first 30 books in the Kindle Cloud Reader library view.  Clicking a rating opens a new Goodreads tab for the book, rates it, and sets the read date to today.  It relies on Chrome being logged into Goodreads; stars will be hidden if not.

## details

### background.js

The background script passes messages between Kindle Cloud Reader and Goodreads tabs.

Kindle Cloud Reader tab sends messages to the extension:
  - library iframe ready: get url for My Books on Goodreads (it includes a user id), then fetch ratings from first page of My Books (30 books)
  - rate: open Goodreads tab with query parameters for search query and rating

### kindle.js

The Kindle Cloud Reader loads a book list in an iframe.  When this is done loading, the extension adds stars to the page and sends a message to the extension that the iframe is ready.  The extension responds with a list of ratings from Goodreads; use these to fill the stars for each book to match Goodreads.  This uses a simple string match on title, which doesn't always work.

Clicking a star sends a message to the extension with the book id and rating.

### goodreads.js

The extension opens a tab on Goodreads with query and ratings parameters.  The content script looks for the rating param, and clicks through the steps to set the book read, rate it, set the read date to today, and save.


### goodreads.js

### credits

Book icon by [Picol.org](http://picol.org/) [CC BY 3.0](http://creativecommons.org/licenses/by/3.0)
