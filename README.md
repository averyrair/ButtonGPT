# ButtonGPT

The button does whatever you say it does!

### Setup

1. Install the required node modules with `npm install electron electron-settings openai dotenv`
2. Fill in your OpenAI API keys into the .env file. 

### Usage

Run `npm start` to start the app. Whatever you input into the text box will be sent to GPT 3.5, which will generate code and update the page to implement the feature. Results may vary 😅. Be aware that unchecked, untested javascript from GPT will be running, so take any precautions you deem necessary. 