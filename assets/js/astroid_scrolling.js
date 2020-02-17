var container = document.querySelector("#auto-scroll");
var stopButton = document.querySelector("#stop-autoScroll");
var resumeButton = document.querySelector("#resume-autoScroll");
var topButton = document.querySelector("#go-to-top");
var intervalscroller;

var count = container.scrollTop;
var isScrolling = true; // scrolling by default
container.scrollTop = 20;
console.log(container.scrollTop);

// function that 
function scroller() {
  intervalscroller = setInterval(function() {
    // when scrolltop + clientheight == scrollheight then we've reached bottom of content
    if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
      count = 0;
    }
  
    count++;
    container.scrollTop = count;
  }, 60);
}

// main function
scroller();

// event listeners if stop resume and top buttons are present
stopButton.addEventListener("click", stopScrolling);
resumeButton.addEventListener("click", resumeScrolling);
topButton.addEventListener("click", goTopTable);

// will take event automatically if given
function stopScrolling() {
  clearInterval(intervalscroller);
  isScrolling = false;
}

function resumeScrolling() {
  if (isScrolling) {
    return;
  } else {
    isScrolling = true;
    count = container.scrollTop;
    scroller(); 

  }
}

function goTopTable() {
  container.scrollTop = 0;
  count = 0; // variable used to set value for scrolltop (which is what controls the variable)
}