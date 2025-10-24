import CommunityLeaderboard from "../components/CommunityLeaderboard";
import Tournaments from "../components/Tournaments";
import { Link } from "react-router-dom";
import { getCommunities, type Community } from "../lib/data/communities";
import { useEffect, useState } from "react";

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

export default function Home() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getCommunities()
            .then(setCommunities)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);


    if (loading)
        return (
            <div className="max-w-4xl mx-auto text-steelgrey">
                Laddar gemenskaper...
            </div>
        );

    if (error)
        return (
            <div className="max-w-4xl mx-auto text-red-400">
                Fel: {error}
            </div>
        );


    return (
        <div className="flex gap-12 flex-col max-w-4xl mx-auto">
            <div>
                <h1 className="text-4xl font-display text-limecore">Välkommen till LimePoint</h1>
                <p className="text-aquaserve text-xl mb-8">Americano made simple</p>
                <p>Skapa, spela och följ dina Americano-turneringar på ett enklare sätt.</p>
                <p>LimePoint samlar spelare, resultat och gemenskaper på ett ställe — utan krångel, bara padelglädje.</p>

                <button className="mt-8 mb-12 bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-2xl hover:bg-limedark transition max-w-max">
                    <Link to="/tournaments/select-community">Skapa turnering</Link>
                </button>
            </div>
            <CommunityLeaderboard
                data={communities.map((c) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    tournaments: c.tournaments_count || 0,
                    lastPlayed: c.last_played
                        ? new Date(c.last_played).toLocaleDateString("sv-SE")
                        : "-",
                }))}
            />
            <Tournaments data={tournaments} />
        </div>
    );
}
