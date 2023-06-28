const express = require("express");
require("dotenv").config();
const cors = require("cors");
const socketMain = require("./socket");
const net = require("net");
const cluster = require("cluster");
const socketio = require("socket.io");
// const io_redis = require("@socket.io/redis-adapter");
const num_processes = require("os").cpus().length;
const farmhash = require("farmhash");
const port = 8000;

if (cluster.isMaster) {
  let workers = [];
  const spawn = function (i) {
    workers[i] = cluster.fork();
    workers[i].on("exit", function (code, signal) {
      spawn(i);
    });
  };
  for (let i = 0; i < num_processes; i++) {
    spawn(i);
  }

  const worker_index = function (ip, len) {
    return farmhash.fingerprint32(ip) % len;
  };

  const server = net.createServer((connection) => {
    const worker =
      workers[worker_index(connection.remoteAddress, num_processes)];
    worker.send("sticky-session:connection", connection);
  });

  server.on("error", function (err) {
    console.error("Error creating server:", err);
  });

  server.listen(port, () => {
    console.log(`Master listening on port ${port}`);
  });
} else {
  const app = express();
  const server = app.listen(0, "localhost");
  const io = socketio(server, {
    allowEIO3: true,
    cors: {
      origin: "*",
      methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
    },
  });
  //   io.adapter(io_redis({ host: "localhost", port: 6379 }));
  io.on("connection", function (socket) {
    socketMain(io, socket);
    console.log(`connected to worker: ${cluster.worker.id}`);
  });
  process.on("message", function (message, connection) {
    if (message !== "sticky-session:connection") {
      return;
    }
    server.emit("connection", connection, (err) => {
      if (err) {
        console.error("Error emitting connection event:", err);
        connection.destroy();
      }
    });
  });
}
