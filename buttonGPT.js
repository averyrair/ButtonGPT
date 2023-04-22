

// Add an event listener to the button
document.getElementById("myButton").addEventListener('click', buttonListener);

async function buttonListener() {
  document.getElementById('myButton').innerHTML = "Thinking..."
  document.getElementById('myButton').disabled = true;
  //without a delay the html doesn't update before the ipc stuff happens
  let value = await delay(10);
  //overwrites the buttonBehavior.js file with new code
  window.electronAPI.generateCode(document.getElementById('inputbox').value);
  //stores the current state of the html in electron-settings
  window.electronAPI.storeHTML(document.getElementById('html').innerHTML);
  //reload the page in order to allow the new code to take effect.
  window.location.reload();
}

const delay = (delayInms) => {
  return new Promise(resolve => setTimeout(resolve, delayInms));
}

//called as soon as the page is reloaded (aka when the button is pressed)
async function onReload() {

  let html = window.electronAPI.getHTML();
  let text = window.electronAPI.getText();

  //overwrite the default html with whatever was last saved.
  if (html) {
    document.getElementById('html').innerHTML = html;

    document.getElementById('myButton').addEventListener('click', buttonListener);
    document.getElementById('myButton').innerHTML = "Click Me!";
    document.getElementById('myButton').disabled = false;
    document.getElementById('inputbox').value = text;
  }

  //execute the GPT generated code
  buttonPressed();
}


