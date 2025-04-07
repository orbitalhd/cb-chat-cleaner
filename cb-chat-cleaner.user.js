// ==UserScript==
// @name         CB Chat Cleaner (Mod-Ready + UI + Log)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Hide, auto-mute or ban spam in Chaturbate chat with toggle UI and log panel for mods. Smart, stealthy, and powerful.
// @author       ohsochilled
// @match        https://chaturbate.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const spamPhrases = [
        'watch me here',
        'my fansly',
        'click here',
        'tip 99 to see more',
        '🔞',
        '💋'
    ];

    const messageHistory = {};
    const spamThreshold = 3;
    let actionMode = 'mute+ban'; // Options: 'none', 'mute', 'mute+ban'
    const spamLog = [];

    // Create UI Panel
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.bottom = '10px';
    panel.style.right = '10px';
    panel.style.backgroundColor = 'rgba(0,0,0,0.8)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.fontSize = '14px';
    panel.style.zIndex = 9999;
    panel.style.borderRadius = '8px';
    panel.innerHTML = `
        <strong>CB Cleaner</strong><br>
        <label><input type="radio" name="mode" value="none"> Off</label><br>
        <label><input type="radio" name="mode" value="mute"> Mute Only</label><br>
        <label><input type="radio" name="mode" value="mute+ban" checked> Mute + Ban</label><br>
        <button id="show-log">📜 View Log</button>
    `;
    document.body.appendChild(panel);

    document.querySelectorAll('input[name="mode"]').forEach(input => {
        input.addEventListener('change', e => {
            actionMode = e.target.value;
        });
    });

    document.getElementById('show-log').addEventListener('click', () => {
        alert('📜 Spam Caught:\n' + spamLog.join('\n'));
    });

    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList.contains('chat-message')) {
                    const text = node.innerText.toLowerCase();
                    const usernameElem = node.querySelector('.username');
                    const user = usernameElem ? usernameElem.innerText.trim() : 'unknown';

                    if (!messageHistory[user]) messageHistory[user] = [];
                    messageHistory[user].push(text);
                    if (messageHistory[user].length > 5) messageHistory[user].shift();

                    const repeatCount = messageHistory[user].filter(msg => msg === text).length;
                    const isSpamPhrase = spamPhrases.some(phrase => text.includes(phrase));

                    const shouldFlag = repeatCount >= spamThreshold || isSpamPhrase;

                    if (shouldFlag) {
                        // Log it
                        spamLog.push(`[${user}] ${text}`);

                        // Visual Dimming
                        node.style.opacity = '0.25';
                        node.style.fontStyle = 'italic';
                        node.style.pointerEvents = 'none';

                        if (actionMode !== 'none') {
                            const settingsBtn = node.querySelector('.settings-button');
                            if (settingsBtn && typeof settingsBtn.click === 'function') {
                                setTimeout(() => {
                                    settingsBtn.click();
                                    const muteBtn = document.querySelector('li[title="Mute"]');
                                    const banBtn = document.querySelector('li[title="Ban"]');

                                    if (actionMode === 'mute' && muteBtn) muteBtn.click();
                                    if (actionMode === 'mute+ban') {
                                        if (muteBtn) muteBtn.click();
                                        setTimeout(() => {
                                            if (banBtn) banBtn.click();
                                        }, 300);
                                    }
                                }, 300);
                            }
                        }
                    }
                }
            });
        });
    });

    const chatContainer = document.querySelector('#chat-box') || document.body;
    observer.observe(chatContainer, { childList: true, subtree: true });
})();
