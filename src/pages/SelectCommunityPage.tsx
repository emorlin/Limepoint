// src/pages/SelectCommunityPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Community = {
    id: string;
    name: string;
    slug: string;
    created_at: string;
};

export default function SelectCommunityPage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
    const [communities, setCommunities] = useState<Community[]>([]);
    const [selectedSlug, setSelectedSlug] = useState<string>("");
    const [newCommunityName, setNewCommunityName] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    // === Hämta alla gemenskaper ===
    useEffect(() => {
        const loadCommunities = async () => {
            const { data, error } = await supabase
                .from("communities")
                .select("id, name, slug, created_at")
                .order("created_at", { ascending: false });

            if (error) {
                console.error("❌ Fel vid hämtning av gemenskaper:", error);
            } else if (data) {
                setCommunities(data as Community[]);
            }
            setLoading(false);
        };

        void loadCommunities();
    }, []);

    // === Skapa ny gemenskap ===
    const handleCreateCommunity = async (): Promise<void> => {
        const name = newCommunityName.trim();
        if (!name) return;

        // skapa slug baserat på namnet
        const slug = name
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const { data, error } = await supabase
            .from("communities")
            .insert([{ name, slug }])
            .select("slug")
            .single();

        if (error) {
            console.error("❌ Kunde inte skapa gemenskap:", error);
            alert("Kunde inte skapa gemenskap. Kanske finns namnet redan?");
            return;
        }

        const created = data as { slug: string } | null;
        if (created?.slug) {
            navigate(`/tournaments/create?slug=${created.slug}`);
        } else {
            console.error("❌ Slug saknas efter skapande av gemenskap.");
        }
    };

    // === Hantera fortsättning beroende på vald flik ===
    const handleContinue = (): void => {
        if (activeTab === "existing" && selectedSlug) {
            navigate(`/tournaments/create?slug=${selectedSlug}`);
        } else if (activeTab === "new" && newCommunityName.trim()) {
            void handleCreateCommunity();
        }
    };

    // === Laddningsvy ===
    if (loading) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20 text-steelgrey">
                Laddar gemenskaper...
            </div>
        );
    }

    // === Huvudvy ===
    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-10">
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">
                    Välj gemenskap
                </h1>
                <p className="text-steelgrey">
                    Skapa turnering inom en befintlig gemenskap eller börja en ny.
                </p>
            </header>

            {/* Flikar */}
            <div className="flex justify-center border-b border-steelgrey/40 mb-4">
                <button
                    onClick={() => setActiveTab("existing")}
                    className={`px-6 py-2 font-semibold transition ${activeTab === "existing"
                        ? "text-limecore border-b-2 border-limecore"
                        : "text-steelgrey hover:text-limecore"
                        }`}
                >
                    Befintlig
                </button>
                <button
                    onClick={() => setActiveTab("new")}
                    className={`px-6 py-2 font-semibold transition ${activeTab === "new"
                        ? "text-limecore border-b-2 border-limecore"
                        : "text-steelgrey hover:text-limecore"
                        }`}
                >
                    Ny
                </button>
            </div>

            {/* Befintlig gemenskap */}
            {activeTab === "existing" && (
                <section>
                    <label className="block text-courtwhite font-semibold mb-2">
                        Välj gemenskap
                    </label>
                    <select
                        className="w-full bg-nightcourt border border-steelgrey/30 rounded-lg p-3 text-courtwhite"
                        onChange={(e) => setSelectedSlug(e.target.value)}
                        defaultValue=""
                    >
                        <option value="" disabled>
                            -- Välj --
                        </option>
                        {communities.map((c) => (
                            <option key={c.id} value={c.slug}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </section>
            )}

            {/* Ny gemenskap */}
            {activeTab === "new" && (
                <section>
                    <label className="block text-courtwhite font-semibold mb-2">
                        Namn på ny gemenskap
                    </label>
                    <input
                        type="text"
                        placeholder="Skriv namn..."
                        value={newCommunityName}
                        onChange={(e) => setNewCommunityName(e.target.value)}
                        className="w-full bg-nightcourt border border-steelgrey/30 rounded-lg p-3 text-courtwhite"
                    />
                </section>
            )}

            {/* Fortsätt-knapp */}
            <div className="pt-6 text-center">
                <button
                    className="bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-xl hover:bg-limedark transition disabled:opacity-50"
                    disabled={
                        (activeTab === "existing" && !selectedSlug) ||
                        (activeTab === "new" && !newCommunityName.trim())
                    }
                    onClick={handleContinue}
                >
                    Fortsätt →
                </button>
            </div>
        </div>
    );
}
