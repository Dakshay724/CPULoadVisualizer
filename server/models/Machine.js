const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const machine = new Schema({
  macA: String,
  cpuLoad: Number,
  freeMem: Number,
  totalMem: Number,
  usedMem: Number,
  memUseage: Number,
  osType: String,
  upTime: Number,
  cpuModel: String,
  numCores: Number,
  cpuSpeed: Number,
});
const Machine = mongoose.model("Machine", machine);
module.exports = Machine;
