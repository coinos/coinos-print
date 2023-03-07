let { format } = require("date-fns");
let WebSocket = require("ws");
let { print } = require("unix-print");
let fs = require("fs");
var html_to_pdf = require("html-pdf-node");

let options = { format: "A4", base: "file:///home/adam/print" };

function compile(strings) {
  return function (...vals) {
    return strings
      .map(function (s, i) {
        return `${s}${vals[i] || ""}`;
      })
      .join("");
  };
}

let template = fs.readFileSync("template.html").toString();

let token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImE5NzcwNDIxLTNmNjUtMTFlZC05ZjU3LTAyNDJhYzJhMDAwNCIsImlhdCI6MTY3ODE0Mjc3Mn0.NlwFF8qc6aEUG5bkbWU8rVDfK0EYTLgEmJ7MvuTyFu8";

let initial = 1000;
let max = 16000;
let delay = initial;
let s;

function send(type, data) {
  if (s.readyState === 1) s.send(JSON.stringify({ type, data }));
  else socket.connect();
}

let handle = {
  connected() {
    send("login", token);
  },

  payment({ data }) {
    let sats = 100000000;
    data = {
      date: format(new Date(data.created), "MMM d, yyyy"),
      time: format(new Date(data.created), "h:mm aaa"),
      fiat: ((data.amount * data.rate) / sats).toFixed(2),
      ...data,
    };

    let content = template;
    for (let k in data) content = content.replace(`{{${k}}}`, data[k]);
    html_to_pdf.generatePdf({ content }, options).then(async (pdfBuffer) => {
      let stream = fs.createWriteStream("output.pdf");
      stream.once("open", () => {
        stream.write(pdfBuffer);
        stream.end();
      });

      stream.on("finish", () => {
        console.log("PRINTING");
        // print("output.pdf").then(console.log);
      });
    });
  },
};

let socket = {
  connect() {
    if (s) return;
    s = new WebSocket("ws://localhost:3119/ws");
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
