import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Administration from "./pages/Administration";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/administration" element={<Administration />} />
    </Routes>
  );
}
