import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Tournaments from "../components/Tournaments";
import { fetchCommunityBySlug } from "../lib/data/communities";
import { getRecentTournaments } from "../lib/data/tournaments";

import { fetchPlayersByCommunity, deactivatePlayer } from "../lib/data/players";

type Community = {
    id: number;
    name: string;
    slug: string;
    created_at: string;
    players?: { id: number; name: string }[];
    tournaments?: { id: number; name: string; created_at: string }[];
};

export default function CommunityPage() {
    const { slug } = useParams();
    const [community, setCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<any[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [tournaments, setTournaments] = useState([]);

    useEffect(() => {
        console.log("Slug från URL:", slug);
    }, [slug]);

    useEffect(() => {
        if (!slug) return;

        const loadCommunity = async () => {
            setLoading(true);
            const data = await fetchCommunityBySlug(slug);
            setCommunity(data);
            setLoading(false);
        };

        loadCommunity();
    }, [slug]);

    useEffect(() => {
        getRecentTournaments().then(setTournaments).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        async function loadPlayers() {
            if (!community?.id) return;
            const data = await fetchPlayersByCommunity(community.id);
            setPlayers(data);
            setLoadingPlayers(false);
        }
        loadPlayers();
    }, [community]);

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




    if (!community) {
        return (
            <div className="max-w-4xl mx-auto text-center mt-10 text-steelgrey">
                <p>Gemenskapen kunde inte hittas.</p>
                <Link to="/communities" className="text-limecore underline">
                    Tillbaka till alla gemenskaper
                </Link>
            </div>
        );
    }


    const handleDeactivate = async (id: string, name: string) => {
        if (!confirm(`Vill du verkligen avaktivera ${name}?`)) return;
        try {
            await deactivatePlayer(id);
            setPlayers((prev) => prev.filter((p) => p.id !== id));
        } catch {
            alert("Ett fel uppstod vid avaktivering.");
        }
    };

    if (loadingPlayers) {
        return (
            <div className="text-steelgrey text-center py-10">
                Hämtar spelare...
            </div>
        );
    }


    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* === HEADER === */}
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">
                    {community.name}
                </h1>
                <p className="text-aquaserve">
                    Grundad{" "}
                    {community.created_at
                        ? new Date(community.created_at).toLocaleDateString("sv-SE")
                        : "okänt datum"}
                </p>
                <p className="text-steelgrey mt-1">
                    {(community.players?.length || 0)} spelare •{" "}
                    {(community.tournaments?.length || 0)} spelade turneringar
                </p>
                <Link className="inline-block mt-8 mb-12 bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-2xl hover:bg-limedark transition max-w-max" to={`/tournaments/create?community=${community.slug}`}>
                    Skapa turnering
                </Link>

            </header>

            {/* === TURNERINGAR === */}
            <section>
                {tournaments.length > 0 ? (

                    <Tournaments data={tournaments} showCommunity={false} />

                ) : (
                    <p className="text-steelgrey italic">
                        Inga turneringar spelade ännu.
                    </p>
                )}
            </section>

            <section className="bg-nightcourt rounded-2xl p-6 shadow-lg border border-steelgrey/20">
                <h2 className="text-2xl font-display font-bold text-limecore mb-4">
                    Aktiva spelare
                </h2>

                {players.length === 0 ? (
                    <p className="text-steelgrey">Inga aktiva spelare i denna gemenskap.</p>
                ) : (
                    <ul className="divide-y divide-steelgrey/20">
                        {players.map((p) => (
                            <li
                                key={p.id}
                                className="flex justify-between items-center py-3"
                            >
                                <div>
                                    <p className="text-courtwhite font-medium">{p.name}</p>
                                    <p className="text-steellight text-sm">
                                        Skapad {new Date(p.created_at).toLocaleDateString("sv-SE")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeactivate(p.id, p.name)}
                                    className="text-red-400 hover:text-red-500 text-sm font-semibold transition"
                                >
                                    Arkivera
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>


    );
}
