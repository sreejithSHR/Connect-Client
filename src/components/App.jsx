import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

// components
import Header from "./Header";
import Sidebar from "./Sidebar";

// pages
import Home from "../page/Home";
import Room from "../page/Room";
import NotFound from "../page/NotFound";
import NewRoom from "../page/NewRoom";

const App = () => {
  const location = useLocation();

  // Check if the current route is `/room/:roomID`
  const hideSidebar = location.pathname.startsWith("/room");

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
          {/* <Route path="/room/:roomID" element={<NewRoom />} /> */}
          <Route path="/room/:roomID" element={<Room />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
