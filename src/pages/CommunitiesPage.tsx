import { useEffect, useState } from "react";
import CommunityLeaderboard from "../components/CommunityLeaderboard";
import { getCommunities, type Community } from "../lib/data/communities";

export default function CommunitiesPage() {
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
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-display text-limecore mb-4">
                Gemenskaper
            </h1>
            <p className="text-aquaserve">
                Alla padelgemenskaper listade efter flest spelade turneringar.
            </p>
            <p className="text-sm mt-4 mb-4">
                En ny gemenskap skapar du samtidigt som du skapar en turnering.
            </p>

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
        </div>
    );
}
