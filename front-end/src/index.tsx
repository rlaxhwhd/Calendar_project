import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { createRoot } from "react-dom/client";
import { ToastContainer } from "react-toastify";
import AvailabilityCalendar from "./component/AvailabilityCalendar";
import LoginScreen from "./component/LoginScreen";
import "./index.scss";
import LinkGenerateButton from "./component/LinkGenerateButton";
import { Google_get_access_token } from "./component/Google";
import Group from "./component/Group";

export default function Root() {
  return (
    <Routes>
      <Route index element={<LoginScreen />} />
      <Route path="/main" element={<LinkGenerateButton />} />
      <Route path="/calendar" element={<AvailabilityCalendar />} />
      <Route path="/group" element={<Group/>}/>
      <Route
        path="/login/google_signup"
        element={<Google_get_access_token />}
      />
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
