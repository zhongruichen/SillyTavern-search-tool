# SillyTavern Web Search Extension

This extension enhances SillyTavern by giving your AI characters the ability to access real-time information from the internet via Google Search. It operates in two powerful modes: Automatic and Manual (Forced Search).

This repository contains two parts that must be installed correctly: a **backend plugin** to handle search requests and a **frontend extension** for the user interface and logic.

## Features

- **Real-time Information**: Allows AI to answer questions about current events, facts, and data beyond its training knowledge.
- **Automatic Mode**: The AI intelligently decides when it needs to perform a web search to answer a user's query.
- **Manual (Forced) Mode**: Forces the AI to perform a web search before every response, ensuring all its answers are based on the latest information.
- **Highly Customizable**: You can configure:
  - The regex command the AI uses to trigger a search.
  - The number of search results to use.
  - The prompt templates used to present search results to the AI.
- **Built-in Tester**: A UI tool to test your trigger regex directly in the settings panel.

## Installation

You must install both the backend and frontend parts for the extension to work.

### 1. Install the Backend Plugin

The backend plugin is a single file that handles the connection to the Google Search API.

1.  Navigate to your SillyTavern `plugins` directory.
2.  Create a new folder named `google-search`.
3.  Copy the file from `backend-plugin/index.js` in this repository into the new `google-search` folder.
4.  Ensure you have server plugins enabled in your `config.yaml`: `enableServerPlugins: true`.

### 2. Install the Frontend Extension

The frontend extension provides the user interface in the "Extensions" panel and contains all the logic for interacting with the AI.

1.  Navigate to your `public/scripts/extensions` directory inside your SillyTavern installation.
2.  Create a new folder named `google-search-tool`.
3.  Copy all the files from the `frontend-extension` directory of this repository (`manifest.json`, `settings.html`, `script.js`, `style.css`) into the new `google-search-tool` folder.

After installing both parts, restart your SillyTavern server and **hard-refresh** the web UI (Ctrl+F5).

## Configuration

1.  Go to the "Extensions" panel (the puzzle piece icon) in SillyTavern.
2.  Find **Web Search (via Google)** in the settings list.
3.  Configure the modes and templates to your liking:
    - **Automatic Mode**: For this to work, you must instruct your AI (e.g., in its system prompt or character card) that it can use the search command. For example, add to your system prompt: "When you need information from the internet, you can search by outputting `(search:"your query")`."
    - **Manual Mode**: Simply enable this toggle. The AI will be automatically prompted to search before every reply.

---
*This extension was developed with the assistance of the Gemini AI model.*
