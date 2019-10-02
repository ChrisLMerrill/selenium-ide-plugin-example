browser.runtime.onInstalled.addListener((details) => {
    console.log('previousVersion', details.previousVersion)
});

browser.browserAction.setBadgeText({
    text: 'plug'
});

console.log('background script is running!');

function sendMessage(path, verb, payload)
    {
    const message = {uri: path, verb: verb, payload: payload};
    return browser.runtime.sendMessage("mooikfkahbdckldjjndioackbalphokd", message); // Chrome
    // return browser.runtime.sendMessage("{a6fd85ed-e919-4a43-a5af-8da18bda539f}", message); // Firefox
    }

const manifest = {
    name: "SeleniumIDE Performance Measurements",
    version: "0.1",
    commands: [
        {
            id: "wppm_start_timer",
            name: "start timer",
            docs: {
                description: "Start a timer to measure a step (or series of steps)",
                target: {name: "target", description: "name of the timer"}
            }
        },
        {
            id: "wppm_end_timer",
            name: "stop timer",
            docs: {
                description: "Finish a timer and record the duration",
                target: {name: "target", description: "name of the timer"},
                value: {
                    name: "variable",
                    description: "name of variable that the resulting duration should be stored in"
                }
            }
        },
        {
            id: "wppm_assert_timer",
            name: "assert timer",
            docs: {
                description: "Assert the duration of a timer",
                target: {name: "timer name", description: "name of the timer"},
                value: {name: "duration", description: "maximum value (in ms)"}
            }
        },
        {
            id: "wppm_assert_load",
            name: "assert last page load",
            docs: {
                description: "Assert the duration of the last page load",
                target: {name: "target", description: "maximum value (in ms)"}
            }
        }
    ]
};

let interval = setInterval(() => {
    sendMessage("/health", "get", null).catch(res => ({error: res.message})).then(res => {
        if (!res)
            {
            sendMessage("/register", "post", manifest).then(() => {
                console.log("plugin is registered with SeleniumIDE.");
            });
            }
        else if (res.error)
            {
            console.log("registration with SeleniumIDE failed: " + res.error);
            }
    });
}, 1000);

var last_load_duration;
function handleMessage(message, sender, sendResponse) {
    console.log(message.duration + "ms to load: " + message.title);
    last_load_duration = message.duration;
}
browser.runtime.onMessage.addListener(handleMessage);

const timers = {};
// listen for messages from SIDE
browser.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message.action === "execute" && message.command)
        {
        const command = message.command.command;
        const target = message.command.target;
        const value = message.command.value;
        if (command === "wppm_start_timer")
            {
            console.log('start the timer: ' + target);
            timers[target] = Date.now();
            return sendResponse(true);
            }
        else if (command === "wppm_end_timer")
            {
            const duration = Date.now() - timers[target];
            console.log(target + '=' + duration);
            if (value)
                sendMessage("/playback/var", "put", {name: value, contents: duration})
            return sendResponse(true);
            }
        else if (command === "wppm_assert_timer")
            {
            const duration = Date.now() - timers[target];
            console.log(target + '=' + duration);
            if (duration > message.command.value)
                return sendResponse({error: "Duration exceeded: " + duration});
            return sendResponse(true);
            }
        else if (command === "wppm_assert_load")
            {
            if (last_load_duration > message.command.target)
                return sendResponse({error: "Duration exceeded: " + last_load_duration + "ms"});
            return sendResponse(true);
            }
        }
    return sendResponse(undefined);  // important
});