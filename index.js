import fastify from "fastify";
import { format } from "date-fns";
import WebSocket from "ws";
import { print } from "unix-print";
import fs from "fs";

let app = fastify();

let template = fs
  .readFileSync("/home/adam/coinos-print/template.txt")
  .toString();

app.post("/pdf", (req, res) => {
  try {
    let { data } = req.body;
    if (data.amount < 0) throw new Error("invalid amount");

    let timeZone = req.headers['x-timezone'];
    let date = new Date(new Date(data.created).toLocaleString("en-US", {timeZone}));

    let sats = 100000000;
    data = {
      date: format(date, "MMM d, yyyy"),
      time: format(date, "h:mm aaa"),
      fiat: ((data.amount * data.rate) / sats).toFixed(2),
      fiatTip: data.tip ? ((data.tip * data.rate) / sats).toFixed(2) : "0.00",
      tip: data.tip || 0,
      ...data,
    };

    let content = template;
    for (let k in data) content = content.replace(`{{${k}}}`, data[k]);
    res.send(content);
  } catch (e) {
    console.log(e);
    res.code(500).send(e.message);
  }
});

app.listen({ host: "0.0.0.0", port: "8084" }, (e, address) => {
  console.log(address);
});
