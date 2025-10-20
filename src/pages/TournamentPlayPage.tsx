import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type TournamentData = {
    tournamentName: string;
    community: string;
    players: string[];
    pointsPerMatch: number;
};

type Match = {
    id: string;
    round: number;
    team1: string[];
    team2: string[];
    score: [number, number];
    confirmed?: boolean;
};

// En enkel shuffle
const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

// Genererar Americano-schema (2 matcher per runda vid 8 spelare)
const generateAmericanoMatches = (players: string[]): Match[] => {
    const n = players.length;
    if (n % 4 !== 0) return [];

    const shuffled = shuffle(players);
    const rounds = n - 1;
    const allMatches: Match[] = [];

    for (let r = 1; r <= rounds; r++) {
        for (let i = 0; i < n; i += 4) {
            const block = shuffled.slice(i, i + 4);
            if (block.length === 4) {
                allMatches.push({
                    id: `${r}-${i}`,
                    round: r,
                    team1: [block[0], block[1]],
                    team2: [block[2], block[3]],
                    score: [0, 0],
                    confirmed: false,
                });
            }
        }
        // enkel rotation
        const fixed = shuffled[0];
        const rest = shuffled.slice(1);
        shuffled.splice(1, n - 1, ...rest.slice(-1), ...rest.slice(0, -1));
    }

    return allMatches;
};

export default function TournamentPlayPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const data = location.state as TournamentData | null;

    const [matches, setMatches] = useState<Match[]>([]);
    const [activeTab, setActiveTab] = useState<"schema" | "tabell">("schema");
    const [activeRound, setActiveRound] = useState(1);

    // initiera turnering
    useEffect(() => {
        if (!data) {
            navigate("/tournaments/create");
            return;
        }
        const newMatches = generateAmericanoMatches(data.players);
        setMatches(newMatches);
    }, [data, navigate]);

    if (!data) return null;
    const { tournamentName, community, players, pointsPerMatch } = data;

    // gruppera per runda
    const rounds = useMemo(() => {
        return matches.reduce((acc: Record<number, Match[]>, m) => {
            acc[m.round] = acc[m.round] || [];
            acc[m.round].push(m);
            return acc;
        }, {});
    }, [matches]);

    // uppdatera resultat
    const updateScore = (id: string, team: 1 | 2, value: number) => {
        setMatches((prev) =>
            prev.map((m) =>
                m.id === id
                    ? {
                        ...m,
                        score: team === 1 ? [value, m.score[1]] : [m.score[0], value],
                    }
                    : m
            )
        );
    };

    // beräkna tabellstatistik (endast confirmed matcher)
    const stats = useMemo(() => {
        return players.map((player) => {
            let games = 0;
            let wins = 0;
            let pd = 0;
            let totalPoints = 0;

            matches.forEach(({ team1, team2, score, confirmed }) => {
                if (!confirmed) return; // hoppa över ej sparade matcher
                const [s1, s2] = score;
                const isTeam1 = team1.includes(player);
                const isTeam2 = team2.includes(player);
                if (isTeam1 || isTeam2) {
                    games++;
                    const own = isTeam1 ? s1 : s2;
                    const opp = isTeam1 ? s2 : s1;
                    totalPoints += own;
                    pd += own - opp;
                    if (own > opp) wins++;
                }
            });

            return { name: player, games, wins, pd, points: totalPoints };
        });
    }, [matches, players]);

    const sorted = [...stats].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pd !== a.pd) return b.pd - a.pd;
        return b.wins - a.wins;
    });

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* === HEADER === */}
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">
                    {tournamentName}
                </h1>
                <p className="text-aquaserve text-lg">
                    {community} • {new Date().toLocaleDateString("sv-SE")}
                </p>
            </header>

            {/* === TABS === */}
            <div className="flex justify-center border-b border-steelgrey/40 mb-4">
                <button
                    onClick={() => setActiveTab("schema")}
                    className={`px-6 py-2 font-semibold transition ${activeTab === "schema"
                        ? "text-limecore border-b-2 border-limecore"
                        : "text-steelgrey hover:text-limecore"
                        }`}
                >
                    Schema
                </button>
                <button
                    onClick={() => setActiveTab("tabell")}
                    className={`px-6 py-2 font-semibold transition ${activeTab === "tabell"
                        ? "text-limecore border-b-2 border-limecore"
                        : "text-steelgrey hover:text-limecore"
                        }`}
                >
                    Tabell
                </button>
            </div>

            {/* === SCHEMA === */}
            {activeTab === "schema" && (
                <>
                    {/* RUNDA-KNAPPAR */}
                    <nav className="flex justify-center gap-2 mb-6 flex-wrap">
                        {Object.keys(rounds).map((num) => (
                            <button
                                key={num}
                                onClick={() => setActiveRound(Number(num))}
                                className={`w-10 h-10 rounded-full border-2 transition font-semibold ${activeRound === Number(num)
                                    ? "border-limecore text-limecore bg-limecore/10"
                                    : "border-steelgrey/40 text-steelgrey hover:border-limecore/40 hover:text-limecore"
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </nav>

                    {/* RUNDA */}
                    <section>
                        <h2 className="text-2xl font-semibold text-courtwhite mb-4 text-center">
                            Omgång {activeRound}
                        </h2>

                        <div className="space-y-6">
                            {rounds[activeRound]?.map((m) => {
                                const total = m.score[0] + m.score[1];
                                const isValid = total === pointsPerMatch;

                                return (
                                    <div key={m.id} className="space-y-3">
                                        {/* MATCHRAD */}
                                        <div
                                            className={`flex items-top sm:items-center justify-center gap-6 border rounded-2xl p-4 transition ${m.confirmed
                                                ? "bg-nightcourt border-limecore/40"
                                                : !isValid &&
                                                    (m.score[0] > 0 || m.score[1] > 0)
                                                    ? "bg-nightcourt border-red-500/50"
                                                    : "bg-nightcourt border-steelgrey/20"
                                                }`}
                                        >
                                            {/* Lag 1 */}
                                            <div className="flex flex-col sm:items-end items-start w-1/3 text-right">
                                                {m.team1.map((p) => (
                                                    <span
                                                        key={p}
                                                        className="text-courtwhite text-sm font-medium"
                                                    >
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Resultat */}
                                            <div className="flex flex-col items-center justify-center w-1/3">
                                                {m.confirmed ? (
                                                    <div className="text-3xl font-bold text-limecore whitespace-nowrap">
                                                        {m.score[0]}{" "}
                                                        <span className="text-steelgrey text-xl">vs</span>{" "}
                                                        {m.score[1]}
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-3 items-center">
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={pointsPerMatch}
                                                            value={m.score[0]}
                                                            onChange={(e) =>
                                                                updateScore(m.id, 1, Number(e.target.value))
                                                            }
                                                            className={`w-16 bg-nightcourt border rounded-lg p-2 text-center text-courtwhite ${!isValid && m.score[0] + m.score[1] > 0
                                                                ? "border-red-500/60"
                                                                : "border-steelgrey/30"
                                                                }`}
                                                        />
                                                        <span className="text-steelgrey font-bold">–</span>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={pointsPerMatch}
                                                            value={m.score[1]}
                                                            onChange={(e) =>
                                                                updateScore(m.id, 2, Number(e.target.value))
                                                            }
                                                            className={`w-16 bg-nightcourt border rounded-lg p-2 text-center text-courtwhite ${!isValid && m.score[0] + m.score[1] > 0
                                                                ? "border-red-500/60"
                                                                : "border-steelgrey/30"
                                                                }`}
                                                        />
                                                    </div>
                                                )}
                                                <div className="text-xs text-steelgrey mt-1">
                                                    till {pointsPerMatch}
                                                </div>
                                            </div>

                                            {/* Lag 2 */}
                                            <div className="flex flex-col sm:items-start items-end  w-1/3 text-left">
                                                {m.team2.map((p) => (
                                                    <span
                                                        key={p}
                                                        className="text-courtwhite text-sm font-medium"
                                                    >
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 🔹 Spara / Ändra-knapp */}
                                        <div className="text-center">
                                            <button
                                                onClick={() => {
                                                    if (!isValid)
                                                        return alert(
                                                            "Summan av poängen måste bli exakt " +
                                                            pointsPerMatch
                                                        );
                                                    setMatches((prev) =>
                                                        prev.map((match) =>
                                                            match.id === m.id
                                                                ? { ...match, confirmed: !match.confirmed }
                                                                : match
                                                        )
                                                    );
                                                }}
                                                className={`px-4 py-2 rounded-lg font-semibold transition ${m.confirmed
                                                    ? "bg-limedark text-nightcourt hover:bg-limecore"
                                                    : isValid
                                                        ? "bg-limecore text-nightcourt hover:bg-limedark"
                                                        : "bg-steelgrey text-nightcourt opacity-50 cursor-not-allowed"
                                                    }`}
                                                disabled={!isValid && !m.confirmed}
                                                title={
                                                    !isValid
                                                        ? `Summan (${total}) måste vara ${pointsPerMatch}`
                                                        : ""
                                                }
                                            >
                                                {m.confirmed ? "Ändra resultat" : "Spara resultat"}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}

            {/* === TABELL === */}
            {activeTab === "tabell" && (
                <section>
                    <h2 className="text-2xl font-semibold text-courtwhite mb-4 text-center">
                        Poängställning
                    </h2>

                    <div className="overflow-x-auto rounded-2xl border border-steelgrey/20 bg-nightcourt">
                        <table className="w-full border-collapse text-sm md:text-base">
                            <thead>
                                <tr className="text-steelgrey border-b border-steelgrey/30 uppercase text-xs tracking-wider">
                                    <th className="py-2 px-3 text-left">Spelare</th>
                                    <th className="py-2 px-3 text-center">G/W</th>
                                    <th className="py-2 px-3 text-center">PD</th>
                                    <th className="py-2 px-3 text-center">Poäng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map((p, i) => (
                                    <tr
                                        key={p.name}
                                        className="border-b border-steelgrey/20 hover:bg-limedark/10 transition"
                                    >
                                        <td className="flex items-center gap-3 py-3 px-3">
                                            <span className="w-5 text-right text-limecore font-bold">
                                                {i + 1}
                                            </span>
                                            <span className="font-medium text-courtwhite truncate">
                                                {p.name}
                                            </span>
                                        </td>
                                        <td className="text-center text-aquaserve font-semibold">
                                            {p.games}/{p.wins}
                                        </td>
                                        <td
                                            className={`text-center font-medium ${p.pd >= 0 ? "text-limecore" : "text-red-400"
                                                }`}
                                        >
                                            {p.pd > 0 ? `+${p.pd}` : p.pd}
                                        </td>
                                        <td className="text-center text-courtwhite font-semibold">
                                            {p.points}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
