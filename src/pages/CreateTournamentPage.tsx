// src/pages/CreateTournamentPage.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchCommunityBySlug } from "../lib/data/communities";
import { createTournament, ensurePlayer } from "../lib/data/tournaments";
import { generateAmericanoMatches } from "../utils/americano";
import { supabase } from "../lib/supabase";

// === Typer ===
type Player = {
    id: string;
    name: string;
    active?: boolean;
};

type Community = {
    id: string | null;
    name: string;
    slug?: string;
    players?: Player[];
};

type Tournament = {
    id: string;
    name: string;
    community_id: string;
    points_per_match: number;
};

export default function CreateTournamentPage() {
    const [isButtonClicked, setIsButtonClicked] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [community, setCommunity] = useState<Community | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [tournamentName, setTournamentName] = useState<string>("");
    const [pointsPerMatch, setPointsPerMatch] = useState<number>(16);
    const [numPlayers, setNumPlayers] = useState<number>(8);
    const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [newPlayerName, setNewPlayerName] = useState<string>("");

    // === Ladda gemenskap ===
    useEffect(() => {
        const loadCommunity = async (): Promise<void> => {
            const slugParam = searchParams.get("slug") || searchParams.get("community");
            const newCommunityName = searchParams.get("newCommunity");

            if (!slugParam && !newCommunityName) {
                setLoading(false);
                return;
            }

            if (slugParam) {
                const data = await fetchCommunityBySlug(slugParam);
                if (data) {
                    const typed = data as Community;
                    setCommunity(typed);
                    const playerNames = (typed.players ?? [])
                        .filter((p) => p.active !== false)
                        .map((p) => p.name);
                    setAvailablePlayers(playerNames);
                }
            } else if (newCommunityName) {
                setCommunity({ id: null, name: newCommunityName, players: [] });
            }

            setLoading(false);
        };

        void loadCommunity();
    }, [searchParams]);

    // === Lägg till ny spelare ===
    const handleAddNewPlayer = async (): Promise<void> => {
        const name = newPlayerName.trim();
        if (!name || !community?.id) return;

        const exists = availablePlayers.some(
            (p) => p.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
            alert("Spelaren finns redan i listan!");
            return;
        }

        const { data, error } = await supabase
            .from("players")
            .insert([{ name, community_id: community.id }])
            .select("name");

        if (error) {
            console.error("❌ Fel vid skapande av spelare:", error);
            alert("Kunde inte lägga till spelare. Försök igen.");
            return;
        }

        const newName = data?.[0]?.name ?? name;
        setAvailablePlayers((prev) => [...prev, newName]);
        setSelectedPlayers((prev) => [...prev, newName]);
        setNewPlayerName("");
    };

    const handleAddPlayer = (player: string): void => {
        if (player && !selectedPlayers.includes(player)) {
            setSelectedPlayers([...selectedPlayers, player]);
        }
    };

    const handleRemovePlayer = (player: string): void => {
        setSelectedPlayers(selectedPlayers.filter((p) => p !== player));
    };

    const handleAddOrSelectPlayer = (): void => {
        const name = newPlayerName.trim();
        if (!name) return;

        if (availablePlayers.includes(name)) {
            handleAddPlayer(name);
        } else {
            const updated = [...availablePlayers, name];
            setAvailablePlayers(updated);
            handleAddPlayer(name);
        }
        setNewPlayerName("");
    };

    // === Skapa turnering ===
    const handleCreate = async (): Promise<void> => {
        if (!community) return;
        if (!community.id) {
            alert("Gemenskapen saknar ID – något gick fel.");
            return;
        }

        if (![4, 8, 12, 16].includes(numPlayers)) {
            alert("Endast 4, 8, 12 eller 16 spelare stöds för Americano just nu.");
            return;
        }

        try {
            // 1. Skapa turneringen
            const tournament = (await createTournament({
                name: tournamentName.trim(),
                communityId: community.id,
                pointsPerMatch,
            })) as Tournament;

            console.log("✅ Turnering skapad:", tournament.id);

            // 2. Se till att alla spelare finns
            const playerIds: string[] = [];
            for (const name of selectedPlayers) {
                const playerId = await ensurePlayer(name, community.id);
                playerIds.push(playerId);
            }

            console.log("✅ Spelare:", playerIds);

            // 3. Generera matcher
            const matches = generateAmericanoMatches(playerIds);
            console.log("✅ Matcher genererade:", matches.length);

            // 4. Spara matcherna
            const { error: matchError } = await supabase
                .from("matches")
                .insert(
                    matches.map((m) => ({
                        tournament_id: tournament.id,
                        round: m.round,
                        team1_player1: m.team1_player1,
                        team1_player2: m.team1_player2,
                        team2_player1: m.team2_player1,
                        team2_player2: m.team2_player2,
                        score1: m.score1,
                        score2: m.score2,
                    }))
                );

            if (matchError) throw matchError;

            console.log("✅ Matcher sparade i databasen!");
            navigate(`/tournaments/play/${tournament.id}`);
        } catch (err) {
            console.error("❌ Fel vid skapande av turnering:", err);
            alert("Något gick fel vid skapande av turneringen.");
        }
    };

    const canCreate =
        tournamentName.trim().length > 0 &&
        [4, 8, 12, 16].includes(numPlayers) &&
        selectedPlayers.length === numPlayers;

    // === Utskrift ===
    if (loading) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20 text-steelgrey">
                Laddar gemenskap...
            </div>
        );
    }

    if (!community) {
        return (
            <div className="max-w-4xl mx-auto text-center py-20 text-red-400">
                Kunde inte hitta gemenskap.
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* HEADER */}
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">
                    Skapa turnering
                </h1>
                <p className="text-steelgrey">
                    Gemenskap:{" "}
                    <span className="text-aquaserve font-medium">{community.name}</span>
                </p>
            </header>

            {/* TURNERINGSNAMN */}
            <section>
                <label className="block text-courtwhite font-semibold mb-2">
                    Turneringsnamn <span className="text-limecore">*</span>
                </label>
                <input
                    id="tournamentName"
                    type="text"
                    placeholder="Ex. Fredagspadel #24"
                    value={tournamentName}
                    onChange={(e) => setTournamentName(e.target.value)}
                    className="w-full bg-nightcourt border border-steelgrey/30 rounded-lg p-3 text-courtwhite"
                />
            </section>

            {/* INSTÄLLNINGAR */}
            <section>
                <h2 className="text-2xl font-semibold text-courtwhite mb-3">
                    Inställningar
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="mb-4">
                        <label
                            htmlFor="numPlayers"
                            className="block text-courtwhite font-semibold mb-2"
                        >
                            Antal spelare
                        </label>

                        <select
                            id="numPlayers"
                            value={numPlayers}
                            onChange={(e) => setNumPlayers(Number(e.target.value))}
                            className="w-full bg-nightcourt border border-steelgrey/30 rounded-lg p-3 text-courtwhite"
                        >
                            {[4, 8, 12, 16].map((num) => (
                                <option key={num} value={num}>
                                    {num} spelare
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-courtwhite font-semibold mb-2">
                            Poäng per match
                        </label>
                        <input
                            type="number"
                            min={5}
                            max={30}
                            value={pointsPerMatch}
                            onChange={(e) => setPointsPerMatch(Number(e.target.value))}
                            className="w-full bg-nightcourt border border-steelgrey/30 rounded-lg p-3 text-courtwhite"
                        />
                    </div>
                </div>
            </section>

            {/* SPELARE */}
            <section>
                <h2 className="text-2xl font-semibold text-courtwhite mb-3">
                    Välj spelare
                </h2>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Tillgängliga spelare */}
                    <div>
                        <h3 className="block text-courtwhite font-semibold mb-2">
                            Tillgängliga
                        </h3>
                        <ul className="bg-nightcourt border border-steelgrey/30 rounded-lg divide-y divide-steelgrey/20 max-h-80 overflow-y-auto">
                            {availablePlayers.length === 0 && (
                                <li className="p-3 text-steelgrey text-sm text-center">
                                    Inga spelare ännu.
                                </li>
                            )}

                            {availablePlayers
                                .slice()
                                .sort((a, b) => a.localeCompare(b, "sv"))
                                .map((p) => {
                                    const isSelected = selectedPlayers.includes(p);
                                    return (
                                        <li
                                            key={p}
                                            className={`flex items-center justify-between px-3 py-2 hover:bg-limedark/10 transition ${isSelected ? "opacity-70" : ""
                                                }`}
                                        >
                                            <span className="text-courtwhite">{p}</span>
                                            {isSelected ? (
                                                <span className="text-steelgrey text-sm italic">
                                                    Tillagd
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => handleAddPlayer(p)}
                                                    className="text-limecore text-sm font-semibold hover:underline"
                                                >
                                                    Lägg till →
                                                </button>
                                            )}
                                        </li>
                                    );
                                })}
                        </ul>

                        {/* Lägg till ny spelare */}
                        <div className="flex gap-2 mt-4">
                            <input
                                type="text"
                                placeholder="Ny spelare..."
                                value={newPlayerName}
                                onChange={(e) => setNewPlayerName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && void handleAddNewPlayer()}
                                className="flex-1 bg-nightcourt border border-steelgrey/30 rounded-lg p-2 text-courtwhite placeholder-steelgrey focus:outline-none focus:border-limecore transition"
                            />
                            <button
                                onClick={handleAddNewPlayer}
                                disabled={!newPlayerName.trim()}
                                className="bg-limecore text-nightcourt font-semibold px-4 rounded-lg hover:bg-limedark transition disabled:opacity-50"
                            >
                                Lägg till
                            </button>
                        </div>
                    </div>

                    {/* Valda spelare */}
                    <div>
                        <h3 className="block text-courtwhite font-semibold mb-2">
                            Valda ({selectedPlayers.length}/{numPlayers})
                        </h3>
                        <ul className="bg-nightcourt border border-steelgrey/30 rounded-lg divide-y divide-steelgrey/20 max-h-80 overflow-y-auto">
                            {selectedPlayers.length === 0 && (
                                <li className="p-3 text-steelgrey text-sm text-center">
                                    Inga spelare valda ännu.
                                </li>
                            )}
                            {selectedPlayers.map((p) => (
                                <li
                                    key={p}
                                    className="flex items-center justify-between px-3 py-2 hover:bg-limedark/10 transition"
                                >
                                    <span className="text-aquaserve">{p}</span>
                                    <button
                                        onClick={() => handleRemovePlayer(p)}
                                        className="text-red-400 text-sm font-semibold hover:underline"
                                    >
                                        Ta bort ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SKAPA */}
            <div className="pt-6">
                <button

                    onClick={async () => {
                        setIsButtonClicked(true);
                        if (canCreate) {
                            await handleCreate();
                        }
                    }}
                    className="bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-xl hover:bg-limedark transition disabled:opacity-50"
                >
                    Skapa turnering →
                </button>


            </div>
            {isButtonClicked && !canCreate && (
                <p className=" text-red-400 text-sm font-semibold ">Du måste ange ett <a href="#tournamentName" className="underline">turneringsnamn</a> samt välja {numPlayers} spelare för att kunna skapa en turnering.</p>
            )}
        </div>
    );
}
