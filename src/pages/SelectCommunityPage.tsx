import { useState } from "react";
import { useNavigate } from "react-router-dom";

const communities = [
    { id: 1, name: "Sublime Slayers", createdAt: "2025-09-01" },
    { id: 2, name: "Södermalm Smashers", createdAt: "2025-08-14" },
];

export default function SelectCommunityPage() {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<"existing" | "new">("existing");
    const [selectedCommunityId, setSelectedCommunityId] = useState<number | null>(
        null
    );
    const [newCommunityName, setNewCommunityName] = useState("");

    const handleContinue = () => {
        if (activeTab === "existing" && selectedCommunityId) {
            navigate(`/tournaments/create?community=${selectedCommunityId}`);
        } else if (activeTab === "new" && newCommunityName.trim()) {
            navigate(`/tournaments/create?newCommunity=${encodeURIComponent(newCommunityName.trim())}`);
        }
    };

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

            {/* Flik 1 — Befintlig */}
            {activeTab === "existing" && (
                <section>
                    <label className="block text-courtwhite font-semibold mb-2">
                        Välj gemenskap
                    </label>
                    <select
                        className="w-full bg-nightcourt border border-steelgrey/30 rounded-lg p-3 text-courtwhite"
                        onChange={(e) => setSelectedCommunityId(Number(e.target.value))}
                        defaultValue=""
                    >
                        <option value="" disabled>
                            -- Välj --
                        </option>
                        {communities.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name} ({new Date(c.createdAt).toLocaleDateString("sv-SE")})
                            </option>
                        ))}
                    </select>
                </section>
            )}

            {/* Flik 2 — Ny */}
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
                        (activeTab === "existing" && !selectedCommunityId) ||
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
