import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchCommunityBySlug } from "../lib/data/communities";
import { createTournament, ensurePlayer } from "../lib/data/tournaments";
import { generateAmericanoMatches } from "../utils/americano";
import { supabase } from "../lib/supabase";


export default function CreateTournamentPage() {
    const [searchParams] = useSearchParams();
    const slug = searchParams.get("slug");
    const newCommunityName = searchParams.get("newCommunity");

    const [community, setCommunity] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [tournamentName, setTournamentName] = useState("");
    const [pointsPerMatch, setPointsPerMatch] = useState(16);
    const [numPlayers, setNumPlayers] = useState(8);
    const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [newPlayerName, setNewPlayerName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        async function loadCommunity() {
            // 🔹 tillåt både ?community=slug och ?slug=slug
            const slugParam = searchParams.get("slug") || searchParams.get("community");
            const newCommunityName = searchParams.get("newCommunity");

            if (!slugParam && !newCommunityName) {
                setLoading(false);
                return;
            }

            if (slugParam) {
                const data = await fetchCommunityBySlug(slugParam);
                if (data) {
                    setCommunity(data);
                    const playerNames = (data.players || []).map((p: any) => p.name);
                    setAvailablePlayers(playerNames);
                    setSelectedPlayers(playerNames);
                } else {
                    console.error("❌ Kunde inte hitta community med slug:", slugParam);
                }
            } else if (newCommunityName) {
                setCommunity({ id: null, name: newCommunityName, players: [] });
            }

            setLoading(false);
        }

        loadCommunity();
    }, [searchParams]);


    const handleAddPlayer = (player: string) => {
        if (player && !selectedPlayers.includes(player)) {
            setSelectedPlayers([...selectedPlayers, player]);
        }
    };

    const handleRemovePlayer = (player: string) => {
        setSelectedPlayers(selectedPlayers.filter((p) => p !== player));
    };

    const handleAddOrSelectPlayer = () => {
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

    const handleCreate = async () => {
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
            // 🔹 1. Skapa turneringen i Supabase
            const tournament = await createTournament({
                name: tournamentName.trim(),
                communityId: community.id,
                pointsPerMatch,
            });

            console.log("✅ Turnering skapad:", tournament.id);

            // 🔹 2. Kontrollera att alla spelare finns (eller skapa dem)
            const playerIds: string[] = [];
            for (const name of selectedPlayers) {
                const playerId = await ensurePlayer(name, community.id);
                playerIds.push(playerId);
            }

            console.log("✅ Spelare:", playerIds);

            // 🔹 3. Generera matcher via Americano-schema
            const matches = generateAmericanoMatches(playerIds);

            console.log("✅ Matcher genererade:", matches.length);

            // 🔹 4. Spara matcherna i Supabase
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

            // 🔹 5. Navigera till turneringssidan
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
                    <span className="text-aquaserve font-medium">
                        {community.name}
                    </span>
                </p>
            </header>

            {/* TURNERINGSNAMN */}
            <section>
                <label className="block text-courtwhite font-semibold mb-2">
                    Turneringsnamn <span className="text-limecore">*</span>
                </label>
                <input
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
                            className="block text-steelgrey text-sm font-medium mb-1"
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

                <div className="relative mb-4 flex gap-2 items-stretch">
                    <div className="relative flex-1">
                        <input
                            list="players"
                            placeholder="Sök eller lägg till spelare..."
                            className="w-full bg-nightcourt border border-steelgrey/30 rounded-lg p-3 pr-10 text-courtwhite placeholder-steelgrey appearance-none focus:outline-none focus:border-limecore transition"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddOrSelectPlayer()}
                        />
                        <datalist id="players">
                            {availablePlayers.map((p) => (
                                <option key={p} value={p} />
                            ))}
                        </datalist>

                        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 text-steelgrey"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </span>
                    </div>

                    <button
                        onClick={handleAddOrSelectPlayer}
                        disabled={!newPlayerName.trim()}
                        className="bg-limecore text-nightcourt font-semibold px-4 rounded-lg hover:bg-limedark transition disabled:opacity-50"
                    >
                        {availablePlayers.includes(newPlayerName.trim()) ? "Välj" : "Lägg till"}
                    </button>
                </div>

                {selectedPlayers.length > 0 && (
                    <ul className="flex flex-wrap gap-2 mb-4">
                        {selectedPlayers.map((p) => (
                            <li
                                key={p}
                                className="bg-limecore/20 text-limecore px-3 py-1 rounded-full flex items-center gap-2"
                            >
                                {p}
                                <button
                                    onClick={() => handleRemovePlayer(p)}
                                    className="text-courtwhite hover:text-red-400 text-sm"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {selectedPlayers.length < numPlayers && (
                    <p className="text-sm text-steelgrey text-center">
                        {selectedPlayers.length} av {numPlayers} tillagda
                    </p>
                )}
            </section>

            {/* SKAPA */}
            <div className="pt-6 text-center">
                <button
                    disabled={!canCreate}
                    onClick={handleCreate}
                    className="bg-limecore text-nightcourt font-semibold px-6 py-3 rounded-xl hover:bg-limedark transition disabled:opacity-50"
                >
                    Skapa turnering →
                </button>
            </div>
        </div>
    );
}
