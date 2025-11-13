// src/pages/Home.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import CommunityLeaderboard from "../components/CommunityLeaderboard";
import Tournaments from "../components/Tournaments";

import { getCommunities, type Community } from "../lib/data/communities";
import { getRecentTournaments } from "../lib/data/tournaments";
import { calculateTop3 } from "../utils/calculateTop3";

// === Utökad typ för communities på startsidan ===
type ExtendedCommunity = Community & {
    tournaments_count?: number;
    last_played?: string | null;
};

type Tournament = {
    id: string;
    name: string;
    date: string;
    community: string;
    communitySlug?: string;
    pointsPerMatch: number;
    top3?: string[];
};

export default function Home() {
    const [communities, setCommunities] = useState<ExtendedCommunity[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // === Hämta gemenskaper ===
    useEffect(() => {
        const loadCommunities = async (): Promise<void> => {
            try {
                const data = await getCommunities();
                setCommunities(data as ExtendedCommunity[]);
            } catch (err) {
                const e = err as Error;
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        void loadCommunities();
    }, []);

    // === Hämta senaste turneringar ===
    useEffect(() => {
        const loadTournaments = async (): Promise<void> => {
            try {
                const data = await getRecentTournaments(5);
                setTournaments(data as Tournament[]);
            } catch (err) {
                console.error("❌ Fel vid hämtning av turneringar:", err);
            }
        };
        void loadTournaments();
    }, []);

    // === Laddning / fel ===
    if (loading) {
        return (
            <div className="max-w-4xl mx-auto text-steelgrey">
                Laddar gemenskaper...
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto text-red-400">
                Fel: {error}
            </div>
        );
    }

    // === Innehåll ===
    return (
        <div className="flex gap-12 flex-col max-w-4xl mx-auto">
            <div>
                <h1 className="text-4xl font-display text-limecore">
                    Välkommen till LimePoint
                </h1>
                <p className="text-aquaserve text-xl mb-8">Americano made simple</p>
                <p>
                    Skapa, spela och följ dina Americano-turneringar på ett enklare sätt.
                </p>
                <p>
                    LimePoint samlar spelare, resultat och gemenskaper på ett ställe —
                    utan krångel, bara padelglädje.
                </p>

                <Link
                    className="inline-block mt-8 mb-12 bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-2xl hover:bg-limedark transition max-w-max"
                    to="/tournaments/select-community"
                >
                    Skapa turnering
                </Link>
            </div>

            {/* Gemenskaper / leaderboard */}
            <CommunityLeaderboard
                data={communities.map((c) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.slug,
                    tournaments: c.tournaments_count ?? 0,
                    lastPlayed: c.last_played
                        ? new Date(c.last_played).toLocaleDateString("sv-SE")
                        : "-",
                }))}
            />

            {/* Senaste turneringar */}
            <Tournaments data={tournaments} showCommunity={true} />
        </div>
    );
}
