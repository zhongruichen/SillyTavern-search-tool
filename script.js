import {
    extension_settings,
    saveSettingsDebounced,
    renderExtensionTemplate,
    sendSystemMessage,
    getContext,
    generate,
    addOneMessage,
} from '../../../../script.js';
import { debounce } from '../../utils.js';

const EXTENSION_NAME = 'google-search-tool';

const DEFAULT_SETTINGS = {
    manual_enabled: false,
    auto_enabled: true,
    triggerRegex: '\\(search:"(.*?)"\\)',
    resultCount: 3,
    wrapperTemplate: 'This is a web search result for the query "{{query}}":\n\n{{results}}',
    itemTemplate: 'Title: {{title}}\nSnippet: {{snippet}}\nURL: {{link}}\n',
};

if (extension_settings[EXTENSION_NAME] === undefined) {
    extension_settings[EXTENSION_NAME] = { ...DEFAULT_SETTINGS };
}
const settings = extension_settings[EXTENSION_NAME];

let isPerformingSearch = false;

function setUiLock(isLocked) {
    const sendButton = document.getElementById('send_but');
    const regenerateButton = document.getElementById('regenerate_button');
    if (sendButton) sendButton.disabled = isLocked;
    if (regenerateButton) regenerateButton.disabled = isLocked;

    if (isLocked) {
        sendSystemMessage('system', 'Performing web search...');
    }
}

function formatResults(query, searchResults) {
    const items = searchResults.map(result => {
        return settings.itemTemplate
            .replace(/{{title}}/g, result.title || '')
            .replace(/{{snippet}}/g, result.snippet || '')
            .replace(/{{link}}/g, result.link || '');
    }).join('\n');

    return settings.wrapperTemplate
        .replace(/{{query}}/g, query)
        .replace(/{{results}}/g, items);
}

async function performSearch(query) {
    if (isPerformingSearch) return null;
    isPerformingSearch = true;
    setUiLock(true);

    try {
        const response = await fetch(`/api/plugins/google-search/search?query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);
        const results = await response.json();
        return results.slice(0, settings.resultCount);
    } catch (error) {
        console.error(`[${EXTENSION_NAME}] Error:`, error);
        sendSystemMessage('error', `Web search failed: ${error.message}`);
        return null;
    } finally {
        isPerformingSearch = false;
    }
}

const originalGenerate = window.generate;
window.generate = async function (options) {
    try {
        if (options?.is_system_message_after_search) {
            return await originalGenerate(options);
        }

        const context = getContext();

        if (settings.manual_enabled && !isPerformingSearch) {
            const forceSearchInstruction = `[SYSTEM INSTRUCTION: Before answering the user, you MUST first decide on a web search query that will help you formulate the best possible answer. Output ONLY the search command in the format (search:"your query here"). Do not say anything else.]`;
            context.userInput = `${forceSearchInstruction}\n\nUSER: ${context.userInput}`;
        }

        if (!settings.manual_enabled && !settings.auto_enabled) {
            return await originalGenerate(options);
        }

        const response = await originalGenerate({ ...options, raw: true });

        if (response && response.results && response.results[0]) {
            const aiResponseText = response.results[0].text;
            const trigger = new RegExp(settings.triggerRegex, 'i');
            const match = aiResponseText.match(trigger);

            if (match && match[1]) {
                const searchQuery = match[1].trim();
                const searchResults = await performSearch(searchQuery);

                if (searchResults) {
                    const formattedString = formatResults(searchQuery, searchResults);
                    await addOneMessage({
                        name: 'System',
                        is_system: true,
                        is_user: false,
                        send_date: Date.now(),
                        mes: formattedString,
                    });
                    return await window.generate({ ...options, is_system_message_after_search: true });
                }
            }
        }

        return response;
    } finally {
        setUiLock(false);
    }
};

async function loadUi() {
    const container = document.getElementById('extensions_settings');
    if (!container) return;

    const template = await renderExtensionTemplate(EXTENSION_NAME, 'settings');
    container.insertAdjacentHTML('beforeend', template);

    const UIElements = {
        auto_enabled: document.getElementById('websearch_auto_enabled'),
        manual_enabled: document.getElementById('websearch_manual_enabled'),
        triggerRegex: document.getElementById('websearch_trigger_regex'),
        resultCount: document.getElementById('websearch_result_count'),
        resultCountValue: document.getElementById('websearch_result_count_value'),
        wrapperTemplate: document.getElementById('websearch_wrapper_template'),
        itemTemplate: document.getElementById('websearch_item_template'),
        testButton: document.getElementById('websearch_test_button'),
        testString: document.getElementById('websearch_test_string'),
        testResult: document.getElementById('websearch_test_result'),
    };

    UIElements.auto_enabled.checked = settings.auto_enabled;
    UIElements.manual_enabled.checked = settings.manual_enabled;
    UIElements.triggerRegex.value = settings.triggerRegex;
    UIElements.resultCount.value = settings.resultCount;
    UIElements.resultCountValue.textContent = settings.resultCount;
    UIElements.wrapperTemplate.value = settings.wrapperTemplate;
    UIElements.itemTemplate.value = settings.itemTemplate;

    const save = () => saveSettingsDebounced();
    UIElements.auto_enabled.addEventListener('change', () => { settings.auto_enabled = UIElements.auto_enabled.checked; save(); });
    UIElements.manual_enabled.addEventListener('change', () => { settings.manual_enabled = UIElements.manual_enabled.checked; save(); });
    UIElements.triggerRegex.addEventListener('input', debounce(() => { settings.triggerRegex = UIElements.triggerRegex.value; save(); }, 500));
    UIElements.resultCount.addEventListener('input', () => {
        const count = UIElements.resultCount.value;
        UIElements.resultCountValue.textContent = count;
        settings.resultCount = Number(count);
        save();
    });
    UIElements.wrapperTemplate.addEventListener('input', debounce(() => { settings.wrapperTemplate = UIElements.wrapperTemplate.value; save(); }, 500));
    UIElements.itemTemplate.addEventListener('input', debounce(() => { settings.itemTemplate = UIElements.itemTemplate.value; save(); }, 500));

    // Logic for the test button
    UIElements.testButton.addEventListener('click', () => {
        const regexString = UIElements.triggerRegex.value;
        const testString = UIElements.testString.value;
        try {
            const regex = new RegExp(regexString, 'i');
            const match = testString.match(regex);
            if (match && match[1]) {
                UIElements.testResult.innerHTML = `✅ Success! Captured query: <span style="color: #00c853;">${match[1]}</span>`;
            } else if (match) {
                UIElements.testResult.innerHTML = `❌ Failed. Regex matched, but no capture group found. Make sure your regex has parentheses, like (.*?).`;
            } else {
                UIElements.testResult.innerHTML = `❌ Failed. Regex did not match the test string.`;
            }
        } catch (error) {
            UIElements.testResult.innerHTML = `❌ Error: Invalid Regular Expression. ${error.message}`;
        }
    });
}

jQuery(async () => {
    await loadUi();
    console.log(`[${EXTENSION_NAME}] Extension loaded, final optimizations complete.`);
});