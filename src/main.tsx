import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { App } from "./App";
import "./index.css";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Test from "./pages/Test";

const root = document.getElementById("root") as HTMLElement;
ReactDOM.createRoot(root).render(
  <StrictMode>
    <DndProvider backend={HTML5Backend}>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/test"
            element={
              <div className="">
                <Test />
              </div>
            }
          />
        </Routes>
      </Router>
    </DndProvider>
  </StrictMode>
);
