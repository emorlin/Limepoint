import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Tournaments from "../components/Tournaments";
import { fetchCommunityBySlug } from "../lib/data/communities";


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

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto text-center mt-10 text-steelgrey">
                <p>Laddar gemenskap...</p>
            </div>
        );
    }

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

    const tournaments = community.tournaments || [];

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
        </div>
    );
}
