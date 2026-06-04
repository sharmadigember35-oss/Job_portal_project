import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./App.css";
import Home from "./components/Home";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import AdminPage from "./components/AdminPage";
import PostJob from "./components/PostJob";
import ResumeMatcher from "./components/ResumeMatcher";
import socket from "./socket";
function App() {
  useEffect(() => {
    // Listen for the statusAlert socket event
    socket.on("statusAlert", (data) => {
      alert(data.message); // You can replace this with a beautiful React Toast alert!
    });

    return () => {
      socket.off("statusAlert");
    };
  }, []);
    
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/post-job" element={<PostJob />} />
        <Route path="/resume-matcher" element={<ResumeMatcher />} />
      </Routes>
    </Router>
  );
}

export default App;
