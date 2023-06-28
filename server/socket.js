const mongoose = require("mongoose");
mongoose.connect(process.env.DB, { useNewUrlParser: true });
const Machine = require("./models/Machine");

function socketMain(io, socket) {
  let macA;

  socket.on("clientAuth", async (key) => {
    if (key === "5t78yuhgirekjaht32i3") {
      socket.join("clients");
    } else if (key === "uihjt3refvdsadf") {
      socket.join("ui");
      console.log("A react client has joined!");
      const docs = await Machine.find();
      docs.forEach((aMachine) => {
        aMachine.isActive = false;
        io.to("ui").emit("data", aMachine);
      });
    } else {
      socket.disconnect(true);
    }
  });

  socket.on("disconnect", () => {
    Machine.find({ macA: macA }, (err, docs) => {
      if (docs.length > 0) {
        // send one last emit to React
        docs[0].isActive = false;
        io.to("ui").emit("data", docs[0]);
      }
    });
  });

  // a machine has connected, check to see if it's new.
  // if it is, add it!
  socket.on("initPerfData", async (data) => {
    // update our socket connect function scoped variable
    macA = data.macA;
    // now go check mongo!
    const mongooseResponse = await checkAndAdd(data);
    console.log(mongooseResponse);
  });

  socket.on("perfData", (data) => {
    console.log("Tick...");
    io.to("ui").emit("data", data);
  });
}

function checkAndAdd(data) {
  // because we are doing db stuff, js wont wait for the db
  // so we need to make this a promise
  return new Promise((resolve, reject) => {
    Machine.findOne({ macA: data.macA }, (err, doc) => {
      if (err) {
        throw err;
        reject(err);
      } else if (doc === null) {
        // these are the droids we're looking for!
        // the record is not in the db, so add it!
        let newMachine = new Machine(data);
        newMachine.save(); //actually save it
        resolve("added");
      } else {
        // it is in the db. just resolve
        resolve("found");
      }
    });
  });
}

module.exports = socketMain;
