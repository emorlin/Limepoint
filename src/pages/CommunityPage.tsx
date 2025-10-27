import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Tournaments from "../components/Tournaments";
import { fetchCommunityBySlug } from "../lib/data/communities";
import { getTournamentsByCommunity } from "../lib/data/tournaments";
import { fetchPlayersByCommunity, deactivatePlayer } from "../lib/data/players";

type Community = {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    players?: { id: string; name: string }[];
    tournaments?: { id: string; name: string; created_at: string }[];
};

export default function CommunityPage() {
    const { slug } = useParams();
    const [community, setCommunity] = useState<Community | null>(null);
    const [loadingCommunity, setLoadingCommunity] = useState(true);
    const [players, setPlayers] = useState<any[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loadingTournaments, setLoadingTournaments] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // === Hämta gemenskap via slug ===
    useEffect(() => {
        if (!slug) return;
        async function loadCommunity() {
            try {
                setLoadingCommunity(true);
                const data = await fetchCommunityBySlug(slug);
                if (!data) throw new Error("Gemenskapen kunde inte hittas.");
                setCommunity(data);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoadingCommunity(false);
            }
        }
        loadCommunity();
    }, [slug]);

    // === Hämta turneringar för gemenskap ===
    useEffect(() => {
        if (!community?.id) return;
        async function loadTournaments() {
            setLoadingTournaments(true);
            const data = await getTournamentsByCommunity(community.id);
            setTournaments(data);
            setLoadingTournaments(false);
        }
        loadTournaments();
    }, [community]);

    // === Hämta spelare ===
    useEffect(() => {
        async function loadPlayers() {
            if (!community?.id) return;
            const data = await fetchPlayersByCommunity(community.id);
            setPlayers(data);
            setLoadingPlayers(false);
        }
        loadPlayers();
    }, [community]);

    const handleDeactivate = async (id: string, name: string) => {
        if (!confirm(`Vill du verkligen avaktivera ${name}?`)) return;
        try {
            await deactivatePlayer(id);
            setPlayers((prev) => prev.filter((p) => p.id !== id));
        } catch {
            alert("Ett fel uppstod vid avaktivering.");
        }
    };

    // === Laddning / fel ===
    if (loadingCommunity)
        return (
            <div className="max-w-4xl mx-auto text-steelgrey">
                Laddar gemenskap...
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
                    {(players.length || 0)} spelare •{" "}
                    {(tournaments.length || 0)} spelade turneringar
                </p>
                <Link
                    className="inline-block mt-8 mb-12 bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-2xl hover:bg-limedark transition max-w-max"
                    to={`/tournaments/create?community=${community.slug}`}
                >
                    Skapa turnering
                </Link>
            </header>

            {/* === TURNERINGAR === */}
            <section>
                <h2 className="text-2xl font-display font-bold text-limecore mb-4">
                    Senaste turneringar
                </h2>

                {loadingTournaments ? (
                    <p className="text-steelgrey">Laddar turneringar...</p>
                ) : tournaments.length > 0 ? (
                    <Tournaments data={tournaments} showCommunity={false} />
                ) : (
                    <p className="text-steelgrey italic">Inga turneringar spelade ännu.</p>
                )}
            </section>

            {/* === SPELARE === */}
            <section className="bg-nightcourt rounded-2xl p-6 shadow-lg border border-steelgrey/20">
                <h2 className="text-2xl font-display font-bold text-limecore mb-4">
                    Aktiva spelare
                </h2>

                {loadingPlayers ? (
                    <p className="text-steelgrey">Laddar spelare...</p>
                ) : players.length === 0 ? (
                    <p className="text-steelgrey">
                        Inga aktiva spelare i denna gemenskap.
                    </p>
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
                                        Skapad{" "}
                                        {new Date(p.created_at).toLocaleDateString("sv-SE")}
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
