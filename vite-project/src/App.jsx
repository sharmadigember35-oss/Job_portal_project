import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/Home";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import AdminPage from "./components/AdminPage";
import PostJob from "./components/PostJob";
import ResumeMatcher from "./components/ResumeMatcher";

function App() {
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
