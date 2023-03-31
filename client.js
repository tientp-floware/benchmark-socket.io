import { io } from 'socket.io-client';
import { appendFileSync } from 'fs';

const URL = process.env.URL || "http://localhost:1321";
const MAX_CLIENTS = 100;
const PING_INTERVAL = 1000;
const POLLING_PERCENTAGE = 0.05;
const CLIENT_CREATION_INTERVAL_IN_MS = 5;

let clientCount = 0;

const latency = {
  sum: 0,
  count: 0,
};

const createClient = () => {
  // for demonstration purposes, some clients stay stuck in HTTP long-polling
  const transports =
    Math.random() < POLLING_PERCENTAGE ? ["polling"] : ["polling", "websocket"];

  const socket = io(URL, {
    transports,
    query: {
      device_uid: `720737cf-94fa-4b0d-812a-1e0dee571b4f`,
      authorization: 'b04ded9619dbc236b9fd22216e40074781c6d10d4fcf3f95449d5ff71244c0e9e7f55f9fe29023789579bdaf3dc2bc71'
    }
  });

  setInterval(() => {
    socket.emit('mgs_to_user', {
      "userId": "email:1813", // memberId or memberEmail
      "memberEmail": "tptkali001@flodev.net", // memberEmail or memberId
      "collectionId": 1, 
      "owerId": 1 // optional
    },(data) => {
      const duration = (Date.now() - data.delay); // in milliseconds
      latency.sum += Number(duration) * 1000; // microseconds
      latency.count++;
    });
  }, PING_INTERVAL);

  socket.on("disconnect", (reason) => {
    console.log(`disconnect due to ${reason}`);
  });

  if (++clientCount < MAX_CLIENTS) {
    setTimeout(createClient, CLIENT_CREATION_INTERVAL_IN_MS);
  }
};

createClient();

const printReport = () => {
  const meanLatency = Math.floor(latency.sum / latency.count);
  latency.sum = latency.count = 0;

  const values = [new Date().toISOString(), clientCount, meanLatency];

  appendFileSync(`printReport-${MAX_CLIENTS}`, `${values.join(";")} \n`);

  console.log(values.join(";"));
};

setInterval(printReport, 1000);
