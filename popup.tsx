import 'bootstrap/dist/css/bootstrap.min.css';
import Form from 'react-bootstrap/Form';
import { useState } from "react"
import { Button, Container, FormControl } from 'react-bootstrap';
import { runCompletion } from './openai';
import { useStorage } from "@plasmohq/storage/hook"


function getPrompt(tabList: string, command: string) {
  return (`You are Assistant. Your task is to help me accomplish tasks to the best of your ability.

Below is a list of tabs I have open. Each tab has the format [TAB INDEX] TAB TITLE | TAB DOMAIN

${tabList}

Given the following instruction, provide the list of tabs to close and tabs to leave open. Err on the side of closing too few tabs rather than closing too many. Multiple tabs may match the instruction. 

${command}

Repeat the index and title of each tab as above, but add a new column after a \`|\` with either OPEN or CLOSE indicating whether the tab should be left open or closed.

[1]`)
}
/*
function getPrompt(tabList: string, command: string) {
  return (`You are Assistant. Your task is to help me accomplish tasks to the best of your ability.

Below is a list of tabs I have open. Each tab has the format [TAB INDEX] TAB TITLE | TAB DOMAIN

${tabList}

${command}:

Given the following instruction, provide the list of tabs to close and tabs to leave open. Err on the side of closing too few tabs rather than closing too many. Multiple tabs may match the instruction. 
Repeat the index and name of each tab as above, but add a new column after a \`|\` with either OPEN or CLOSE indicating whether the tab should be left open or closed.
`);
}
*/
function domainFromUrl(url: string) {
  return new URL(url).hostname;
}
async function getAllTabNames() {
  const tabs = await chrome.tabs.query({});
  return tabs.map(tab => `${tab.title} | ${domainFromUrl(tab.url)}`);
}

function IndexPopup() {
  const [command, setCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [openaiApiKey, setOpenaiApiKey] = useStorage("openaikey"); //TODO(rohan): Should use securestorage?

  const sendRequest = async (event) => {
    event.preventDefault();
    const tabNames = await getAllTabNames();
    const tabList = tabNames.map((tabName, index) => `[${index + 1}] ${tabName}`).join("\n");
    const prompt = getPrompt(tabList, command);
    console.log(prompt);
    setIsLoading(true);
    const response = await runCompletion({
      openaiApiKey, prompt, config: {
        model: "text-davinci-003",
        max_tokens: 1024,
        temperature: 0.0,
        //stopSequences: ["}"] // TODO(rohan): FIX
      }
    });
    // regex to extract a number from response between [ and ]
    // then for each index, extract CLOSE or OPEN after the | at the end
    const indicesToClose = [];
    ("[1]" + response).split("\n").forEach((line) => {
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
    });
    const tabs = await chrome.tabs.query({});
    for (const index of indicesToClose) {
      await chrome.tabs.remove(tabs[index - 1].id);
    }
    setCommand("");
    setIsLoading(false);
    window.close();
  }

  const disabled = !openaiApiKey || !command || isLoading;
  if (!openaiApiKey) {
    return null;
  }

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
      </Form>
    </Container>
  );
}

export default IndexPopup;
