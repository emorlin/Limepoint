import Tournaments from "../components/Tournaments";

import { Link } from "react-router-dom";
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

export default function TournamentsPage() {
    return (
        <>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-display text-limecore mb-4">Alla turneringar</h1>
                <p className="text-aquaserve mb-4">Nedan följer en lista på alla spelade turneringar</p>
                <Link className="inline-block mt-8 mb-12 bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-2xl hover:bg-limedark transition max-w-max" to="/tournaments/select-community">Skapa turnering</Link>

                <Tournaments data={tournaments} />
            </div>

        </>
    );
}
