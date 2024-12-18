// components
import Header from "./Header";
import Sidebar from "./Sidebar";

// pages
import Home from "../page/Home";
import Room from "../page/Room";
import NotFound from "../page/NotFound";
import NewRoom from "../page/NewRoom";
import Stream from "../page/Stream";

import { Routes, Route, useLocation } from "react-router-dom";

const App = () => {
  const location = useLocation();

  // Check if the current route is `/room/:roomID`
  const hideSidebar = location.pathname.startsWith("/room")|| location.pathname.startsWith("/stream");

  return (
    <div className="flex">
      {/* Conditionally render Sidebar */}
      {!hideSidebar && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}
      <div className="max-h-screen overflow-auto w-full">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/room/:roomID" element={<Room />} />
          <Route path="/stream/:roomID" element={<Stream />} /> {/* Updated route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
