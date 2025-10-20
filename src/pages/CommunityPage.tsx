
import { community } from "../data/communityData";
import Tournaments from "../components/Tournaments";
import { Link } from "react-router-dom";

const tournaments = [
    {
        id: 1,
        name: "Fredagspadel #23",

        top3: ["Erik", "Tomas", "Mathias"],
        date: "2025-10-12",
    },
    {
        id: 2,
        name: "Fredag Americano",

        top3: ["Anna", "Jonas", "Micke"],
        date: "2025-10-10",
    },
    {
        id: 3,
        name: "Västerås Open",

        top3: ["Karin", "Erik", "Alex"],
        date: "2025-10-08",
    },
];

export default function CommunityPage() {


    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* HEADER */}
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">
                    {community.name}
                </h1>
                <p className="text-aquaserve">
                    Grundad {new Date(community.createdAt).toLocaleDateString("sv-SE")}
                </p>
                <p className="text-steelgrey mt-1">
                    {community.players.length} spelare • {community.tournaments.length} spelade turneringar
                </p>
                <button className="mt-8 mb-12 bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-2xl hover:bg-limedark transition max-w-max">
                    <Link to={`/tournaments/create?community=${community.id}`}>
                        Skapa turnering
                    </Link>
                </button>
            </header>

            {/* TURNERINGAR */}
            <section>
                <Tournaments data={tournaments} showCommunity={false} />
            </section>
        </div>
    );
}
