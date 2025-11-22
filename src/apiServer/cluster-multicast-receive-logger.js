const dgram = require("node:dgram");

const MCAST_ADDR = "230.185.184.183";
const PORT = 54321;

const client = dgram.createSocket({ type: "udp4", reuseAddr: true });

client.on("listening", () => {
  client.addMembership(MCAST_ADDR);
});