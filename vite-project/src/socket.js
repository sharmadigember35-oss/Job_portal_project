import { io } from "socket.io-client";

const userId = localStorage.getItem("userId");

const socket = io("http://localhost:3000", {  // ← change 5000 to 3000
  query: { userId },
  autoConnect: true,
});

export default socket;