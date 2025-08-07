import { Socket } from "node:net";

export default {
  async fetch(request) {
    const socket = new Socket();
    socket.connect(8787, "127.0.0.1");
    socket.destroy();

    return new Response("Hello, world!");
  },
};
