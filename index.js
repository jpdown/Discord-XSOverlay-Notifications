"use strict";

const RPC = require("discord-rpc");
const https = require("https");
const Stream = require("stream").Transform;
const udp = require("dgram");

const clientId = "";
const clientSecret = "";
const scopes = ['rpc', 'rpc.notifications.read'];
const redirectUri = 'http://localhost';

const client = new RPC.Client({transport: 'ipc'});

function dispatch(xsmessage) {
    let server = udp.createSocket("udp4");
    server.send(xsmessage, 42069, "localhost", () => {
        server.close();
    });
}

function getIcon(evt, xsmessage) {
    let icon = new Stream();
    let base64 = "";
    https.get(evt.icon_url, (response) => {
        response.on('data', d => {
            icon.push(d);
        });

        response.on('end', () => {
            base64 = icon.read().toString("base64");
            xsmessage.icon = base64;

            dispatch(JSON.stringify(xsmessage));
        });
    });

    return base64;
}

client.on('ready', () => {
    console.log("Logged in as", client.application.name);
    console.log("Authed for user", client.user.username);

    client.subscribe("NOTIFICATION_CREATE", (evt) => {
        let xsmessage = {
            "messageType": 1,
            "index": 0,
            "timeout": 5,
            "height": 175,
            "opacity": 1,
            "volume": 0.7,
            "audioPath": "",
            "title": `${evt.title} - Discord`,
            "content": evt.body,
            "useBase64Icon": true,
            "sourceApp": "XSOverlay Discord RPC"
        };

        getIcon(evt, xsmessage);
    });
});

client.login({ clientId: clientId, scopes: scopes, clientSecret: clientSecret, redirectUri: redirectUri });
