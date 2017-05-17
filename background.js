/*
    get a rating from Kindle page and add to Goodreads
*/
var tabs = {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('onMessage request=', request, ' sender=', sender);
  // clicked rating: open tab
  if (sender.url.indexOf('read.amazon.com') >= 0 && request.rating) {
    var url = `https://www.goodreads.com/search?q=${request.q}&rating=${request.rating}`;
    chrome.tabs.create({url: url, active: false}, function(t) {
      tabs[t.id] = { q: request.q, rating: request.rating };
      console.log('opened tab ', t.id);
      sendResponse({ action: 'open' });
    });
  }
  if (sender.url.indexOf('read.amazon.com') >= 0 && request.libraryIframe) {
    $.get('https://www.goodreads.com/').then(function(response) {
      var match = response.match(/(\/review\/list\/\d+)/);
      if (match) {
        var ratings = [];
        $.get(`https://www.goodreads.com${match[1]}`).then(function(my) {
          $(my).find('.rating .stars').each(function() {
            var $book = $(this);
            ratings.push({
              rating: $book.attr('data-rating'),
              title: $book.closest('tr').find('.title a:first').attr('title'),
            });
          });
          sendResponse({ action: 'ratings', ratings: ratings, login: true });
        });
        chrome.pageAction.show(sender.tab.id);
      } else {
        sendResponse({ action: 'no login', login: false });
        chrome.pageAction.setIcon({path: 'no-login.png'});
        chrome.pageAction.hide(sender.tab.id);
        // TODO: send message to kindle page?
      }
    });
  }
  if (sender.url.indexOf('www.goodreads.com') >= 0) {
    sendResponse({ action: 'rated' });
  }
  return true;
});
