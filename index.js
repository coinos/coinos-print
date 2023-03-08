import fs from "fs";
import WebSocket from "ws";
import { print } from "unix-print";
import password from "./password.js";

let initial = 1000;
let max = 16000;
let delay = initial;
let s;

function send(type, data) {
  if (s.readyState === 1) s.send(JSON.stringify({ type, data }));
  else socket.connect();
}

let { token } = 
    await fetch("https://coinos.io/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: "bob", password })}).then(r => r.json());
let handle = {
  connected() {
    send("login", token);
  },

  async payment({ data }) {
    let n = `${data.id}.pdf`;
    let f = await fetch("https://coinos.io/pdf", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ data })}).then(r => r.arrayBuffer());
    fs.writeFileSync(n, Buffer.from(new Uint8Array(f)));
    print(n).then(console.log);
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
    delay = initial;
  },

  message({ data }) {
    data = JSON.parse(data);
    let { type } = data;
    console.log(new Date(), type);
    handle[type] && handle[type](data);
  },

  close() {
    console.log(new Date(), "closing");
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
