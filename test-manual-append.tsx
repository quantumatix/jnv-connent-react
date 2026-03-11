import * as React from 'react';
// Testing the auto scroll hook logic in isolation

// Simulate the way message-list tracks new messages
const messages = [{ _id: '1', content: 'hello' }];

let lastTopLevelMsgId = '1';
let isScrolledUpRef = false;

// Now a socket event arrives
messages.push({ _id: '2', content: 'world' });

const latestId = messages[messages.length - 1]._id;
if (latestId !== lastTopLevelMsgId) {
    console.log("New message detected");
    if (!isScrolledUpRef) {
        console.log("SCROLLING DOWN");
    } else {
        console.log("SHOWING BADGE");
    }
}
