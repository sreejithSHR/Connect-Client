// components
import Header from "./Header";
import Sidebar from "./Sidebar";

// pages
import Home from "../page/Home";
import Browse from "../page/Browse";
import Room from "../page/Room";
import Stream from "../page/Stream";
import NotFound from "../page/NotFound";

import { Routes, Route, useLocation } from "react-router-dom";

const App = () => {
  const location = useLocation();

  // Immersive routes (meeting / stream) keep the slim sidebar but drop the top
  // header — they render their own in-stage title row.
  const immersive =
    location.pathname.startsWith("/room") || location.pathname.startsWith("/stream");

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-ink">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex w-full min-w-0 flex-col">
        {!immersive && <Header />}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/room/:roomID" element={<Room />} />
            <Route path="/stream/:roomID" element={<Stream />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
