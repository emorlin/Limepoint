// src/pages/TournamentsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Tournaments from "../components/Tournaments";
import { getRecentTournaments } from "../lib/data/tournaments";

// === Typ för turneringar ===
type Tournament = {
    id: string;
    name: string;
    date: string;
    community: string;
    communitySlug?: string;
    pointsPerMatch: number;
    top3?: string[];
};

export default function TournamentsPage() {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);

    useEffect(() => {
        const load = async (): Promise<void> => {
            try {
                const data = await getRecentTournaments();
                setTournaments(data as Tournament[]);
            } catch (err) {
                const e = err as Error;
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto text-steelgrey">
                Laddar turneringar...
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

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-display text-limecore mb-4">
                Alla turneringar
            </h1>
            <p className="text-aquaserve mb-4">
                Nedan följer en lista på alla spelade turneringar.
            </p>

            <Link
                className="inline-block mt-8 mb-12 bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-2xl hover:bg-limedark transition max-w-max"
                to="/tournaments/select-community"
            >
                Skapa turnering
            </Link>

            <Tournaments data={tournaments} showCommunity={true} />
        </div>
    );
}
