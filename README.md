# Prompt Inspector

Adds an option to inspect and edit output prompts before sending them to the server.

## Usage

1. Make sure you're using SillyTavern 1.12.1 or later. The latest `staging` branch is recommended.
2. Install via the built-in extension manager using the URL: `https://github.com/SillyTavern/Extension-PromptInspector`
3. Find a new option in the wand menu to toggle the prompt inspector.
4. Send any chat prompt to get a popup with the prompt data.

## Remarks

1. Chat Completion prompts should be a valid JSON-serialized array of objects. It represents the completion BEFORE applying backend-specific post-processing, i.e. any number of system messages, assistant message first, non-alternating roles, etc. are ALLOWED.
2. Text Completion prompts can be any string that doesn't overflow the prompt length limit in tokens. Go wild!
3. Pressing "Cancel" discards any changes, but doesn't cancel the request.
4. Pressing "OK" sends the modified prompt to the server. Modified prompts are ephemeral and not saved.

## License

AGPL-3.0
