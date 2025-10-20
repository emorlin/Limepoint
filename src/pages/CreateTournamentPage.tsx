import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const communities = [
    {
        id: 1,
        name: "Sublime Slayers",
        players: ["Erik", "Tomas", "Mathias", "Anna", "Jonas", "Micke", "Karin", "Alex"],
    },
    {
        id: 2,
        name: "Södermalm Smashers",
        players: ["Anna", "Jonas", "Micke", "Lisa", "Henrik"],
    },
];

export default function CreateTournamentPage() {
    const [searchParams] = useSearchParams();
    const communityId = searchParams.get("community");
    const newCommunityName = searchParams.get("newCommunity");

    const [community, setCommunity] = useState<any | null>(null);
    const [tournamentName, setTournamentName] = useState("");
    const [pointsPerMatch, setPointsPerMatch] = useState(16);
    const [numPlayers, setNumPlayers] = useState(8);
    const [availablePlayers, setAvailablePlayers] = useState<string[]>([]);
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [newPlayerName, setNewPlayerName] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (communityId) {
            const found = communities.find((c) => c.id === Number(communityId));
            if (found) {
                setCommunity(found);
                setAvailablePlayers(found.players);
                setSelectedPlayers([]);
                //   setSelectedPlayers(found.players);
            }
        } else if (newCommunityName) {
            setCommunity({ id: null, name: newCommunityName, players: [] });
            setAvailablePlayers([]);
        }
    }, [communityId, newCommunityName]);

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

    const handleCreate = () => {
        console.log({
            tournamentName,
            community: community?.name,
            players: selectedPlayers,
            pointsPerMatch,
        });
        navigate("/tournaments/play", {
            state: {
                tournamentName,
                community: community?.name,
                players: selectedPlayers,
                pointsPerMatch,
            },
        });
    };

    const canCreate =
        tournamentName.trim().length > 0 &&
        selectedPlayers.length === numPlayers;

    console.log(canCreate);

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* HEADER */}
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">
                    Skapa turnering
                </h1>
                {community && (
                    <p className="text-steelgrey">
                        Gemenskap:{" "}
                        <span className="text-aquaserve font-medium">
                            {community.name}
                        </span>
                    </p>
                )}
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
                    {/* 🔍 Inputfält med egen pil */}
                    <div className="relative flex-1">
                        <input
                            list="players"
                            placeholder="Sök eller lägg till spelare..."
                            className="w-full bg-nightcourt border border-steelgrey/30 rounded-lg p-3 pr-10 text-courtwhite placeholder-steelgrey appearance-none focus:outline-none focus:border-limecore transition"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddOrSelectPlayer()}
                        />
                        <datalist id="players">
                            {availablePlayers.map((p) => (
                                <option key={p} value={p} />
                            ))}
                        </datalist>

                        {/* 🔽 Anpassad pil (visas även i iOS) */}
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

                    {/* ➕ Knapp */}
                    <button
                        onClick={handleAddOrSelectPlayer}
                        disabled={!newPlayerName.trim()}
                        className="bg-limecore text-nightcourt font-semibold px-4 rounded-lg hover:bg-limedark transition disabled:opacity-50"
                    >
                        {availablePlayers.includes(newPlayerName.trim()) ? 'Välj' : 'Lägg till'}
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
