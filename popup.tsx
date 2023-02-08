import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import browser from "webextension-polyfill";
import { useEffect, useState } from "react"
import { Button, Container } from 'react-bootstrap';
import { streamCompletion } from './openai';
import { useStorage } from "@plasmohq/storage/hook"
import GPT3Tokenizer from 'gpt3-tokenizer';


function getPrompt(tabList: string, command: string) {
  return (`You are Assistant. Your task is to help me accomplish tasks to the best of your ability.

Below is a list of tabs I have open. Each tab has the format [TAB INDEX] TAB TITLE | TAB DOMAIN

${tabList}

Given the following instruction, provide the list of tabs to close and tabs to leave open. Err on the side of closing too few tabs rather than closing too many. Multiple tabs may match the instruction. 

${command}

Repeat the index and title of each tab as above, but add a new column after a \`|\` with either OPEN or CLOSE indicating whether the tab should be left open or closed.

[1]`)
}

async function getCurrentTab() {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function domainFromUrl(url: string) {
  return new URL(url).hostname;
}

async function estimateCost() {
  const tabs = await browser.tabs.query({});
  const tabNames = tabs.map(tab => `${tab.title} | ${domainFromUrl(tab.url)}`);
  const tabList = tabNames.map((tabName, index) => `[${index + 1}] ${tabName}`).join("\n");
  const prompt = getPrompt(tabList, "A generic command to close tabs");
  const tokenizer = new GPT3Tokenizer({ type: 'gpt3' });
  const { bpe } = tokenizer.encode(prompt);
  return `$${((2 * bpe.length / 1000) * 0.02).toFixed(3)}`
}

function parseLines(lines: string[], tabs: any) {
  const indicesToClose = [];
  console.log(lines);
  for (const line of lines) {
    const regex = /\[(\d+)\]/g;
    const match = regex.exec(line);
    if (match) {
      const index = parseInt(match[1]);
      const lineParts = line.split("|")
      const closeOrOpen = lineParts[lineParts.length - 1].trim();
      if (closeOrOpen === "CLOSE") {
        indicesToClose.push(index);
      }
    }
  }
  return indicesToClose;
}


function IndexPopup() {
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useStorage("openaikey", ""); //TODO(rohan): Should use securestorage?
  const [cost, setCost] = useState("");
  const [currentTab, setCurrentTab] = useState("");

  const sendRequest = async (event) => {
    event.preventDefault();
    const tabs = await browser.tabs.query({});
    const currentTab = await getCurrentTab();
    const tabNames = tabs.map(tab => `${tab.title} | ${domainFromUrl(tab.url)}`);
    const tabList = tabNames.map((tabName, index) => `[${index + 1}] ${tabName}`).join("\n");
    const prompt = getPrompt(tabList, command);
    setIsLoading(true);
    let currentLine = "[1]";
    let closeCurrentTab = false;
    await streamCompletion({
      data: {
        openaiApiKey, prompt, config: {
          model: "text-davinci-003",
          max_tokens: 1800,
          temperature: 0.0,
        }
      },
      onMessage: async function (completion: string) {
        currentLine += completion;
        setCurrentTab(currentLine);
        if (currentLine.includes("\n")) {
          const lines = currentLine.split("\n");
          // remove the last line
          currentLine = lines.pop();
          const indicesToClose = parseLines(lines, tabs);
          for (const index of indicesToClose) {
            if (tabs[index - 1].id === currentTab.id) {
              // Don't close the current tab until we're done with all the others
              closeCurrentTab = true;
            } else {
              await browser.tabs.remove(tabs[index - 1].id);
            }
          }
        }
      },
      onError: function (err: string): void {
        console.error(err);
      },
      onClose: function (): void {
        if (currentLine.endsWith("OPEN") || currentLine.endsWith("CLOSE")) {
          const indicesToClose = parseLines([currentLine], tabs);
          for (const index of indicesToClose) {
            browser.tabs.remove(tabs[index - 1].id);
          }
        }
        if (closeCurrentTab) {
          browser.tabs.remove(currentTab.id);
        }
        currentLine = "";
        setCurrentTab(currentLine);
        setCommand("");
        setIsLoading(false);
        window.close();
      }
    });
  }

  useEffect(() => {
    estimateCost().then(setCost);
  }, []);


  const disabled = !openaiApiKey || !command || isLoading;

  return (
    <Container className="p-4" style={{ width: "500px" }}>
      <Form onSubmit={!disabled ? sendRequest : null}>
        <Form.Group className="mb-3">
          <Form.Label>OpenAI API Key</Form.Label>
          <Form.Control type="password" onChange={(e) => setOpenaiApiKey(e.target.value)} value={openaiApiKey} />
          <Form.Text className="text-muted">
            Your API key is only stored on your device.
          </Form.Text>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Command</Form.Label>
          <Form.Control type="input" onChange={(e) => setCommand(e.target.value)} value={command} />
        </Form.Group>
        <Button
          disabled={disabled}
          variant="primary"
          type="submit">{isLoading ? 'Loading...' : 'Run'}</Button>
        {currentTab === "" ?
          <p className="text-muted mt-3">Approx cost: {cost}</p>
          :
          <p className="text-muted mt-3" style={{ minHeight: "50px" }}>Processing {currentTab}</p>
        }
      </Form>
    </Container>
  );
}

export default IndexPopup;
