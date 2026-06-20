/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { AiCall } from "./pages/AiCall";
import { Leads } from "./pages/Leads";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="call" element={<AiCall />} />
        <Route path="leads" element={<Leads />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
