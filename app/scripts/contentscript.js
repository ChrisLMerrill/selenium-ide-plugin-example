console.log('content script is running in the page!');

function documentLoaded() {
    var duration = Date.now() - start_time;
    console.log("Document loaded in " + duration);
    browser.runtime.sendMessage({title:document.title, duration:duration});
}

const start_time = Date.now();
window.addEventListener('load',documentLoaded,false);

