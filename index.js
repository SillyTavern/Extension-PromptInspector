import { eventSource, event_types, main_api, stopGeneration } from '../../../../script.js';
import { renderExtensionTemplateAsync } from '../../../extensions.js';
import { POPUP_RESULT, POPUP_TYPE, Popup } from '../../../popup.js';

const path = 'third-party/Extension-PromptInspector';

if (!('GENERATE_AFTER_COMBINE_PROMPTS' in event_types) || !('CHAT_COMPLETION_PROMPT_READY' in event_types)) {
    toastr.error('Required event types not found. Update SillyTavern to the latest version.');
    throw new Error('Events not found.');
}

function isChatCompletion() {
    return main_api === 'openai';
}

function addLaunchButton() {
    const enabledText = 'Stop Inspecting';
    const disabledText = 'Inspect Prompts';
    const enabledIcon = 'fa-solid fa-bug-slash';
    const disabledIcon = 'fa-solid fa-bug';

    const getIcon = () => inspectEnabled ? enabledIcon : disabledIcon;
    const getText = () => inspectEnabled ? enabledText : disabledText;

    const launchButton = document.createElement('div');
    launchButton.id = 'inspectNextPromptButton';
    launchButton.classList.add('list-group-item', 'flex-container', 'flexGap5', 'interactable');
    launchButton.tabIndex = 0;
    launchButton.title = 'Toggle prompt inspection';
    const icon = document.createElement('i');
    icon.className = getIcon();
    launchButton.appendChild(icon);
    const textSpan = document.createElement('span');
    textSpan.textContent = getText();
    launchButton.appendChild(textSpan);

    const extensionsMenu = document.getElementById('prompt_inspector_wand_container') ?? document.getElementById('extensionsMenu');
    extensionsMenu.classList.add('interactable');
    extensionsMenu.tabIndex = 0;

    if (!extensionsMenu) {
        throw new Error('Could not find the extensions menu');
    }

    extensionsMenu.appendChild(launchButton);
    launchButton.addEventListener('click', () => {
        toggleInspectNext();
        textSpan.textContent = getText();
        icon.className = getIcon();
    });
}

let inspectEnabled = localStorage.getItem('promptInspectorEnabled') === 'true' || false;

function toggleInspectNext() {
    inspectEnabled = !inspectEnabled;
    toastr.info(`Prompt inspection is now ${inspectEnabled ? 'enabled' : 'disabled'}`);
    localStorage.setItem('promptInspectorEnabled', String(inspectEnabled));
}

eventSource.on(event_types.CHAT_COMPLETION_PROMPT_READY, async (data) => {
    if (!inspectEnabled) {
        return;
    }

    if (data.dryRun) {
        console.debug('Prompt Inspector: Skipping dry run prompt');
        return;
    }

    if (!isChatCompletion()) {
        console.debug('Prompt Inspector: Not a chat completion prompt');
        return;
    }

    const promptJson = JSON.stringify(data.chat, null, 4);
    const result = await showPromptInspector(promptJson);

    if (result === promptJson) {
        console.debug('Prompt Inspector: No changes');
        return;
    }

    try {
        const chat = JSON.parse(result);

        // Chat is passed by reference, so we can modify it directly
        if (Array.isArray(chat) && Array.isArray(data.chat)) {
            data.chat.splice(0, data.chat.length, ...chat);
        }

        console.debug('Prompt Inspector: Prompt updated');
    } catch (e) {
        console.error('Prompt Inspector: Invalid JSON');
        toastr.error('Invalid JSON');
    }
});

eventSource.on(event_types.GENERATE_AFTER_COMBINE_PROMPTS, async (data) => {
    if (!inspectEnabled) {
        return;
    }

    if (data.dryRun) {
        console.debug('Prompt Inspector: Skipping dry run prompt');
        return;
    }

    if (isChatCompletion()) {
        console.debug('Prompt Inspector: Not a chat completion prompt');
        return;
    }

    const result = await showPromptInspector(data.prompt);

    if (result === data.prompt) {
        console.debug('Prompt Inspector: No changes');
        return;
    }

    data.prompt = result;
    console.debug('Prompt Inspector: Prompt updated');
});

/**
 * Shows a prompt inspector popup.
 * @param {string} input Initial prompt JSON
 * @returns {Promise<string>} Updated prompt JSON
 */
async function showPromptInspector(input) {
    const template = $(await renderExtensionTemplateAsync(path, 'template'));
    const prompt = template.find('#inspectPrompt');
    prompt.val(input);
    /** @type {import('../../../popup').CustomPopupButton} */
    const customButton = {
        text: 'Cancel generation',
        result: POPUP_RESULT.CANCELLED,
        appendAtEnd: true,
        action: async () => {
            await stopGeneration();
            await popup.complete(POPUP_RESULT.CANCELLED);
        },
    };
    const popup = new Popup(template, POPUP_TYPE.CONFIRM, '', { wide: true, large: true, okButton: 'Save changes', cancelButton: 'Discard changes', customButtons: [customButton] });
    const result = await popup.show();

    // If the user cancels, return the original input
    if (!result) {
        return input;
    }

    return String(prompt.val());
}

(function init() {
    addLaunchButton();
})();
