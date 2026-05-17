import { Route, Routes } from "react-router";

import { SiteHeader } from "./components/SiteHeader";
import { ContactPage } from "./routes/ContactPage";
import { LandingPage } from "./routes/LandingPage";
import { PrivacyPage } from "./routes/PrivacyPage";

export function App() {
  return (
    <div className="app-shell">
      <SiteHeader />

      <Routes>
        <Route index element={<LandingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
      </Routes>
    </div>
  );
}
