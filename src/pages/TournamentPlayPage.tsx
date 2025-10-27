// src/pages/TournamentPlayPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getTournamentById } from "../lib/data/tournaments";

// === Typer ===
type Match = {
    id: string;
    round: number;
    team1: string[];
    team2: string[];
    score: [number, number];
    confirmed?: boolean;
};

type Tournament = {
    id: string;
    name: string;
    community: string;
    pointsPerMatch: number;
    players?: string[];
    matches: Match[];
};

// === Komponent ===
export default function TournamentPlayPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const localData = location.state as Tournament | null;

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [activeTab, setActiveTab] = useState<"schema" | "tabell">("schema");
    const [activeRound, setActiveRound] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);

    // === Hämta turnering ===
    useEffect(() => {
        const load = async (): Promise<void> => {
            if (localData?.name && localData.matches) {
                // 🔹 Ny turnering via state
                setTournament(localData);
                setMatches(localData.matches);
                setLoading(false);
                return;
            }

            if (id) {
                // 🔹 Hämta från Supabase
                const data = await getTournamentById(id);
                if (data) {
                    const typed = data as Tournament;
                    setTournament(typed);
                    setMatches(typed.matches);
                }
                setLoading(false);
                return;
            }

            navigate("/tournaments");
        };

        void load();
    }, [id, navigate, localData]);

    // === Uppdatera resultat lokalt ===
    const updateScore = (matchId: string, team: 1 | 2, value: string): void => {
        setMatches((prev) =>
            prev.map((m) => {
                const num = value === "" ? NaN : Number(value);
                return m.id === matchId
                    ? {
                        ...m,
                        score:
                            team === 1
                                ? [num, m.score[1]]
                                : [m.score[0], num],
                    }
                    : m;
            })
        );
    };


    // === Gruppera per runda ===
    const rounds = useMemo<Record<number, Match[]>>(() => {
        return matches.reduce<Record<number, Match[]>>((acc, m) => {
            acc[m.round] = acc[m.round] || [];
            acc[m.round].push(m);
            return acc;
        }, {});
    }, [matches]);

    // === Beräkna tabell (endast confirmed matcher) ===
    const stats = useMemo(() => {
        if (!tournament?.players && matches.length === 0) return [];

        const players =
            tournament?.players ??
            Array.from(
                new Set(
                    matches.flatMap((m) => [...m.team1, ...m.team2]).filter(Boolean)
                )
            );

        return players.map((player) => {
            let games = 0;
            let wins = 0;
            let pd = 0;
            let totalPoints = 0;

            matches.forEach(({ team1, team2, score, confirmed }) => {
                if (!confirmed) return;
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
    }, [matches, tournament]);

    const sorted = [...stats].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pd !== a.pd) return b.pd - a.pd;
        return b.wins - a.wins;
    });

    // === Spara resultat ===
    const saveResult = async (match: Match): Promise<void> => {
        if (!tournament) return;

        const total = match.score[0] + match.score[1];
        if (total !== tournament.pointsPerMatch) {
            alert(`Summan måste bli exakt ${tournament.pointsPerMatch} poäng.`);
            return;
        }

        const { error } = await supabase
            .from("matches")
            .update({
                score1: match.score[0],
                score2: match.score[1],
            })
            .eq("id", match.id);

        if (error) {
            console.error("❌ Fel vid sparande:", error);
            alert("Kunde inte spara resultatet.");
            return;
        }

        // ✅ Toggle confirmed
        setMatches((prev) =>
            prev.map((m) =>
                m.id === match.id ? { ...m, confirmed: !m.confirmed } : m
            )
        );
    };

    // === Laddning / fel ===
    if (loading)
        return (
            <div className="max-w-4xl mx-auto text-center py-20 text-steelgrey">
                Laddar turnering...
            </div>
        );

    if (!tournament)
        return (
            <div className="max-w-4xl mx-auto text-center py-20 text-red-400">
                Kunde inte hitta turnering.
            </div>
        );

    const { name, community, pointsPerMatch } = tournament;

    // === UI ===
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* HEADER */}
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">{name}</h1>
                <p className="text-aquaserve text-lg">
                    {community} • {new Date().toLocaleDateString("sv-SE")}
                </p>
            </header>

            {/* TABS */}
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
                                        <div
                                            className={`flex items-top sm:items-center justify-center gap-6 border rounded-2xl p-4 transition ${m.confirmed
                                                ? "bg-nightcourt border-limecore/40"
                                                : !isValid && (m.score[0] > 0 || m.score[1] > 0)
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
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={Number.isNaN(m.score[0]) ? "" : m.score[0]}
                                                            onChange={(e) => {
                                                                let val = e.target.value.replace(/[^0-9]/g, "");
                                                                const num = Number(val);
                                                                if (num > pointsPerMatch) val = String(pointsPerMatch);
                                                                updateScore(m.id, 1, val);
                                                            }}
                                                            placeholder={`0–${pointsPerMatch}`}
                                                            className={`w-16 bg-nightcourt border rounded-lg p-2 text-center text-courtwhite ${!isValid && total > 0
                                                                ? "border-red-500/60"
                                                                : "border-steelgrey/30"
                                                                }`}
                                                        />

                                                        <span className="text-steelgrey font-bold">–</span>

                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={Number.isNaN(m.score[1]) ? "" : m.score[1]}
                                                            onChange={(e) => {
                                                                let val = e.target.value.replace(/[^0-9]/g, "");
                                                                const num = Number(val);
                                                                if (num > pointsPerMatch) val = String(pointsPerMatch);
                                                                updateScore(m.id, 2, val);
                                                            }}
                                                            placeholder={`0–${pointsPerMatch}`}
                                                            className={`w-16 bg-nightcourt border rounded-lg p-2 text-center text-courtwhite ${!isValid && total > 0
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
                                            <div className="flex flex-col sm:items-start items-end w-1/3 text-left">
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

                                        {/* 🔹 Spara/ändra-knapp */}
                                        <div className="text-center">
                                            <button
                                                onClick={() => void saveResult(m)}
                                                className={`px-4 py-2 rounded-lg font-semibold transition ${m.confirmed
                                                    ? "bg-limedark text-nightcourt hover:bg-limecore"
                                                    : isValid
                                                        ? "bg-limecore text-nightcourt hover:bg-limedark"
                                                        : "bg-steelgrey text-nightcourt opacity-50 cursor-not-allowed"
                                                    }`}
                                                disabled={!isValid && !m.confirmed}
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
