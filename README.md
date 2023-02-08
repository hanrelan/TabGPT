# TabGPT
## Close tabs with precision using GPT3

TabGPT is a browser extension (tested on Chrome and Firefox) that allows you to use natural language to close unwanted tabs. Here'a video of TabGPT in action:

https://user-images.githubusercontent.com/34352/217678133-0320056c-5886-412b-8e9e-e883a097d3d3.mov



### Current status

TabGPT is currently an *experiment* and not available in the Chrome Web Store. It's quite expensive to run due to the nature of the prompt. Contributions are welcome!

#### Roadmap:
- [ ] Keep the script running even when popup is closed
- [ ] Make it work even with *lots* of tabs
- [ ] Add voice control

## Getting Started

You will need to [get an OpenAI API Key](https://www.educative.io/answers/how-to-get-api-key-of-gpt-3) to use this extension. 

To load the extension, follow the instructions for your browser:

### Chrome
1. In the URL bar, enter `chrome://extensions` and enable Developer Mode.
2. Click on "Load unpacked" and select the `build/chrome-mv3-prod` folder.
3. Click on the puzzle piece icon on the Chrome toolbar, and click on TabGPT.
4. You can pin the extension to the toolbar for easy access.

### Firefox
1. In the URL bar, enter `about:debugging#/runtime/this-firefox` and click on "Load Temporary Add-on".
2. Select the `build/firefox-mv3-prod/manifest.json` file.
3. Click on the puzzle piece icon on the Firefox toolbar, and click on TabGPT.
4. You can pin the extension to the toolbar for easy access.


## Development

This is a [Plasmo extension](https://docs.plasmo.com/).

To run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

For further guidance, [visit Plasmo's Documentation](https://docs.plasmo.com/).

## Gratitude
Thanks to [Promptable.ai](https://github.com/promptable) and the [gpt3-chrome-starter](https://github.com/promptable/gpt3-chrome-starter) for the openai streaming and completion code.

Also thanks to all the other open source projects that made this possible.
