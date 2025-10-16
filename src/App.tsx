import { useState } from 'react'
import './App.css'
import AppLayout from './components/AppLayout'
import CommunityLeaderboard from "./components/CommunityLeaderboard";
import Tournamnets from "./components/Tournaments";


const communities = [
  { id: 1, name: "Sublime Slayers", tournaments: 14, lastPlayed: "2025-10-12" },
  { id: 2, name: "Södermalm Smashers", tournaments: 9, lastPlayed: "2025-10-05" },
  { id: 3, name: "Americano Crew", tournaments: 6, lastPlayed: "2025-09-30" },
  { id: 4, name: "Västerås Vibes", tournaments: 5, lastPlayed: "2025-09-15" },
];

const tournaments = [
  {
    id: 1,
    name: "Fredagspadel #23",
    community: "Sublime Slayers",
    top3: ["Erik", "Tomas", "Mathias"],
    date: "2025-10-12",
  },
  {
    id: 2,
    name: "Fredag Americano",
    community: "Södermalm Smashers",
    top3: ["Anna", "Jonas", "Micke"],
    date: "2025-10-10",
  },
  {
    id: 3,
    name: "Västerås Open",
    community: "Västerås Vibes",
    top3: ["Karin", "Erik", "Alex"],
    date: "2025-10-08",
  },
];

function App() {

  return (
    <AppLayout>
      {/* Här kommer allt innehåll senare */}
      <div className="flex gap-12 flex-col  max-w-4xl mx-auto">
        <div>
          <h1 className="text-4xl font-display text-limecore">Välkommen till Limepoint</h1>
          <p className="text-aquaserve text-xl mb-8 ">Americano made simple</p>
          <p>Skapa, spela och följ dina Americano-turneringar på ett enklare sätt.</p>
          <p>LimePoint samlar spelare, resultat och gemenskaper på ett ställe — utan krångel, bara padelglädje.</p>
          <button className="mt-8 mb-12 bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-2xl hover:bg-limedark transition max-w-max">
            Skapa turnering
          </button>
        </div>
        <CommunityLeaderboard data={communities} />
        <Tournamnets data={tournaments} />
      </div>



    </AppLayout>
  )
}

export default App
