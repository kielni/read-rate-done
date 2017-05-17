// check if on library page

// rating stars
var stars = '<div class="stars">';
for (var i = 1; i < 6; i++) {
  stars += '<div class="star" data="'+i+'"</div>';
}
stars += '</div>';

// add stars
$('.book_details').slice(0, 12).each(function() {
    $(this).append(stars);
});

// click listener for stars
$('.star').on('click', function(ev) {
  var rating = $(ev.target).attr('data');
  var bookId = $(ev.target).closest('book_container').attr('id');
  //window.postMessage({ rating: rating, q: bookId }, "*");
  // send message to extension to do rating
  chrome.runtime.sendMessage({ rating: rating, q: bookId }, function(response) {
    console.log(response);
  });
});

window.addEventListener('message', function(event) {
  // open Goodreads tab
  // https://www.goodreads.com/search?q=B01BIFA2HG
  /*
set rating:
document.querySelector('button[value="read"]').click()
document.querySelector('form.reviewForm .stars .star')[3].click() (0-indexed)
document.querySelectorAll('.endedAtSetTodayLink')[1].click()
document.querySelector('input[value="Save"]').click()
  */
});
