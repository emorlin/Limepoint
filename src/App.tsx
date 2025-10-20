import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import TournamentsPage from "./pages/TournamentsPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />

          {/* 🆕 Enskild turnering */}
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
