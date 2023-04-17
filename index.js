import fs from "fs";
import WebSocket from "ws";
import { print } from "unix-print";
import token from "./token.js";

import { exec } from "child_process";

let initial = 1000;
let max = 16000;
let delay = initial;
let s;

console.log(new Date(), "STARTING");

function send(type, data) {
  if (s.readyState === 1) s.send(JSON.stringify({ type, data }));
  else socket.connect();
}

let handle = {
  connected() {
    send("login", token);
  },

  async payment({ data }) {
    let n = `${data.id}.txt`;
    let f = await fetch("https://coinos.io/text", { method: "POST", headers: { "content-type": "application/json", "x-timezone": "America/Vancouver" }, body: JSON.stringify({ data })}).then(r => r.text());
    fs.writeFileSync("printout", f);

    exec('sh $PWD/print.sh', (err, stdout) => console.log("printing", stdout));
  },
};

let socket = {
  connect() {
    if (s) return;
    s = new WebSocket("wss://coinos.io/ws");
    s.addEventListener("open", socket.open);
    s.addEventListener("close", socket.close);
    s.addEventListener("message", socket.message);
    s.addEventListener("error", socket.error);
  },

  open() {
      console.log(new Date(), "socket opened");
    delay = initial;
  },

  message({ data }) {
    data = JSON.parse(data);
    let { type } = data;
    handle[type] && handle[type](data);
  },

  close() {
    console.log(new Date(), "socket closed");
    s = null;
    setTimeout(() => {
      socket.reconnect();
    }, delay + Math.floor(Math.random() * 3000));
  },

  error(e) {
    console.log("err", e);
    socket.close();
  },

  reconnect() {
    if (delay < max) delay *= 2;
    socket.connect();
  },
};

socket.connect();

setInterval(() => {
  send("heartbeat");
}, 5000);
