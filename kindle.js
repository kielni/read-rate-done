/*
  run on read.amazon.com
  add rating stars to library view
  on click, send message to extension with rating and book id
*/

// rating stars
var stars = '<div class="kcr2gr stars">';
for (var i = 1; i < 6; i++) {
  stars += '<div class="star off" data="'+i+'"></div>';
}
stars += '</div>';

$(document).arrive('#KindleLibraryIFrame', function() {
  console.log('KGR: iframe arrived ');
  // all_frames: true doesn't work with dynamically added iframes
  // arrive.js doesn't work with iframes
  var poll = setInterval(function() {
    var $iframe = $('#KindleLibraryIFrame').contents();
    var details = $iframe.find('.book_details');
    if (details.length) {
      clearInterval(poll);
      chrome.runtime.sendMessage({ libraryIframe: true }, function(response) {
        console.log('response=', response);
        (response.ratings || []).forEach(function(book) {
          var stars = $iframe.find(`.book_title:contains("${book.title}")`).parent().find('.stars');
          if (stars.length) {
            setRating(stars, parseInt(book.rating, 10));
          }
        });
        if (!response.login) { // not logged in
          // hide stars
          $iframe.find('.kcr2gr.stars').hide();
        }
      });
      var head = $iframe.find('head');
      head.append('<link rel="stylesheet" type="text/css" href="'+chrome.extension.getURL('stars.css')+'"/>');
      details.slice(0, 30).each(function() {
        if ($(this).find('.kcr2gr').length) {
          return;
        }
        console.log('KGR: add stars to ', $(this).closest('.book_container').attr('id'));
        $(this).append(stars);
      });
      // click listener for stars
      $iframe.find('.star').on('click', function(ev) {
        var rating = parseInt($(ev.target).attr('data'), 10);
        var bookId = $(ev.target).closest('.book_container').attr('id');
        setRating($(ev.target).closest('.stars'), rating);
        console.log('KGR: send rating ', rating, ' for ', bookId);
        // send message to extension to do rating
        chrome.runtime.sendMessage({ rating: rating, q: bookId }, function(response) {
          console.log('KGR: rating response=', response);
        });
      });
    }
  }, 500);
});

function setRating(stars, rating) {
  stars.find('.star').each(function(idx) {
    if (idx < rating) {
      $(this).removeClass('off');
      $(this).addClass('on');
    } else {
      $(this).removeClass('on');
      $(this).addClass('off');
    }
  });
}
