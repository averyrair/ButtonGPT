const { app, Menu, BrowserWindow, ipcMain } = require('electron');
const settings = require('electron-settings')
const path = require('path');
const { Configuration, OpenAIApi } = require('openai');
const fs = require('fs');
require('dotenv').config();



const configuration = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION_KEY,
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration);

//set up initial page
async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });


  ipcMain.on('generate-code', await generateCode);
  ipcMain.on('store-html', await storeHTML);
  ipcMain.on('get-html', await getHTML);
  ipcMain.on('get-text', await getText);

  mainWindow.loadFile('index.html');
  
}

app.whenReady().then(() => {

  //get rid of default file menu
  const template = [];
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  //clear out saved stuff from previous session
  settings.unset();
  fs.writeFile("./buttonBehavior.js", "function buttonPressed() {}", (err) => {
    if (err)
      console.log(err);
    else {
      console.log("File written successfully\n");
      console.log("The written has the following contents:");
      console.log(fs.readFileSync("./buttonBehavior.js", "utf8"));
    }
  });

  //load the window
  createWindow();
});

//allows the input text to be preserved when the page refreshes.
var prevText = "";
async function getText(event) {
  event.returnValue = prevText;
}

//stores and retrieves the current html layout so it can be restored after the page is refreshed to reload the js.
async function storeHTML(event, html) {
    settings.set("page", html);
}

async function getHTML(event) {
    let page = await settings.get("page")
    if (page) {
      event.returnValue = page;
    }
    else {
      event.returnValue = null;
    }
}

//gets the code from GPT
async function generateCode(event, prompt) {

    //if the prompt hasn't changed, don't try to generate new code again just run what's already there.
    if (prompt === prevText) {
      event.returnValue = 1;
      return;
    }
    prevText = prompt;
    

    let htmlContext = "Here is the html file for the electron app. Under no circumstances should you reply with anything but the plaintext function.:\n" +
    fs.readFileSync('./index.html', 'utf-8') +
    "when pressed, the button should output \"hello world\" to the console."

    //if there are html contents that are already stored, use those instead of the default html so the model has an accurate layout.
    let page = await settings.get("page");
    if (page) {
      htmlContext = "Here is the html file for the electron app. Under no circumstances should you reply with anything but the plaintext function.:\n" +
      "<!DOCTYPE html>" +
      "<html id=\"html\">" +
      page +
      "</html>\n" + 
      "\n" +
      "when pressed, the button should output \"hello world\" to the console."
    }

    //prompt GPT with a few messages so it understands what it should do.
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo-0301",
      messages: [
        {
          role: "system", 
          content: "You will implement a function, buttonPressed, for an electron app which defines the behavior of a button. You will respond with only code in plain text format with no additional explanation. Do not use markdown formatting in your response. Do not make any assumptions about the structure of the project and do not attempt to utilize any additional files. The code should be able to be run without any modifications."
        },
        {
          role: "user", 
          content: htmlContext
        },
        //giving the model a couple examples of expected output.
        {
          role: "assistant", 
          content: "function buttonPressed() {\n" +
            "     console.log(\"hello world\");\n" +
            "}"
        },
        {
          role: "user",
          content: "when pressed the button should change the button color to blue"
        },
        {
          role: 'assistant',
          content: "function buttonPressed() \{\n" +
            "     document.getElementById(\"myButton\").style.backgroundColor = \"blue\";\n" +
            "}"
        },
        {
          role: "user", 
          content: `when pressed the button should ${prompt}. Do not assume the existence of any other files or resources. The code should be able to be run right away. Also do not try to get images from the internet.`
        }
      ]
    });

    //write the generated code to a file to be included when the page is refreshed.
    await fs.writeFile("./buttonBehavior.js", completion.data.choices[0].message.content, (err) => {
      if (err)
        console.log(err);
      else {
        console.log("File written successfully\n");
        console.log("The written has the following contents:");
        console.log(fs.readFileSync("./buttonBehavior.js", "utf8"));
      }
    });

    //apparently gotta return something here or stuff executes out of order ¯\_(ツ)_/¯
    event.returnValue = 1;
}