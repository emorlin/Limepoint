import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Home from "./pages/Home";
import TournamentsPage from "./pages/TournamentsPage";
import CommunitiesPage from "./pages/CommunitiesPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import CommunityPage from "./pages/CommunityPage";
import SelectCommunityPage from "./pages/SelectCommunityPage";
import TournamentPlayPage from "./pages/TournamentPlayPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tournaments" element={<TournamentsPage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/communities/:slug" element={<CommunityPage />} />
          <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
          <Route path="/tournaments/create" element={<CreateTournamentPage />} />
          <Route path="/tournaments/select-community" element={<SelectCommunityPage />} />
          <Route path="/tournaments/play/:id" element={<TournamentPlayPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>

      </AppLayout>
    </BrowserRouter>
  );
}
