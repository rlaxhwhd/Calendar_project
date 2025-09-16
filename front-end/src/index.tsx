import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import AvailabilityCalendar from "./component/AvailabilityCalendar";
import LoginScreen from "./component/LoginScreen";

export default function Root() {
  return (
    <Routes>      
      <Route index element={<LoginScreen/>} />
      <Route path="/calendar" element={<AvailabilityCalendar/>} />
    </Routes>
  );
}

const container = document.getElementById("app");
const root = createRoot(container!); // createRoot(container!) if you use TypeScript

root.render(
  <>
    <ToastContainer
      position="bottom-right"
      style={{ fontSize: "1em", width: "auto", minWidth: "10rem" }}
    />
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </>
);
