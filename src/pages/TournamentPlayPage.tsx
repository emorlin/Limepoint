// src/pages/TournamentPlayPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getTournamentById } from "../lib/data/tournaments";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

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

interface ValidationResult {
    valid: boolean;
    issues: string[];
    stats: {
        totalMatches: number;
        maxOpponentMeetings: number;
        avgOpponentMeetings: string;
        opponentMeetingsDistribution: {
            once: number;
            twice: number;
            thrice: number;
            moreThanThrice: number;
        };
    };
}

// === Valideringsfunktion ===
function validateAmericanoSchedule(matches: Match[], players: string[]): ValidationResult {
    const partnerCount = new Map<string, number>();
    const opponentCount = new Map<string, number>();

    function getPairKey(a: string, b: string): string {
        return [a, b].sort().join("-");
    }

    for (const match of matches) {
        const team1 = match.team1;
        const team2 = match.team2;

        // Räkna partners
        if (team1.length === 2) {
            const key = getPairKey(team1[0], team1[1]);
            partnerCount.set(key, (partnerCount.get(key) || 0) + 1);
        }
        if (team2.length === 2) {
            const key = getPairKey(team2[0], team2[1]);
            partnerCount.set(key, (partnerCount.get(key) || 0) + 1);
        }

        // Räkna motståndare
        for (const p1 of team1) {
            for (const p2 of team2) {
                const key = getPairKey(p1, p2);
                opponentCount.set(key, (opponentCount.get(key) || 0) + 1);
            }
        }
    }

    const issues: string[] = [];

    // Kontrollera partners (ska vara exakt 1)
    for (const [pair, count] of partnerCount.entries()) {
        if (count !== 1) {
            issues.push(`Par ${pair} har spelat tillsammans ${count} gånger (ska vara 1)`);
        }
    }

    // Kontrollera motståndare (max 3 accepteras, 4+ är problem)
    for (const [pair, count] of opponentCount.entries()) {
        if (count > 3) {
            issues.push(`Par ${pair} har mötts som motståndare ${count} gånger (max 3 rekommenderat)`);
        }
    }

    const opponentValues = Array.from(opponentCount.values());

    return {
        valid: issues.length === 0,
        issues,
        stats: {
            totalMatches: matches.length,
            maxOpponentMeetings: opponentValues.length > 0 ? Math.max(...opponentValues) : 0,
            avgOpponentMeetings: opponentValues.length > 0
                ? (opponentValues.reduce((a, b) => a + b, 0) / opponentValues.length).toFixed(2)
                : "0",
            opponentMeetingsDistribution: {
                once: opponentValues.filter(v => v === 1).length,
                twice: opponentValues.filter(v => v === 2).length,
                thrice: opponentValues.filter(v => v === 3).length,
                moreThanThrice: opponentValues.filter(v => v > 3).length
            }
        }
    };
}

// === Komponent ===
export default function TournamentPlayPage() {

    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const localData = location.state as Tournament | null;

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [matches, setMatches] = useState<Match[]>([]);
    const [activeTab, setActiveTab] = useState<"schema" | "tabell" | "validering">("schema");
    const [activeRound, setActiveRound] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [focusedMatch, setFocusedMatch] = useState<string | null>(null);
    const [focusedTeam, setFocusedTeam] = useState<1 | 2 | null>(null);

    const [editingValue, setEditingValue] = useState<string | null>(null);


    // === Hämta turnering ===
    useEffect(() => {
        const load = async (): Promise<void> => {
            if (localData?.name && localData.matches) {
                // 🔹 Ny turnering via state
                setTournament(localData);
                setMatches(localData.matches);

                // Kör validering
                const players = localData.players ??
                    Array.from(new Set(localData.matches.flatMap((m) => [...m.team1, ...m.team2])));
                if (localData.matches.length > 0 && players.length > 0) {
                    const validationResult = validateAmericanoSchedule(localData.matches, players);
                    setValidation(validationResult);
                }

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

                    // Kör validering
                    const players = typed.players ??
                        Array.from(new Set(typed.matches.flatMap((m) => [...m.team1, ...m.team2])));
                    if (typed.matches.length > 0 && players.length > 0) {
                        const validationResult = validateAmericanoSchedule(typed.matches, players);
                        setValidation(validationResult);
                    }
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
    const playerCount = tournament?.players?.length ??
        Array.from(new Set(matches.flatMap((m) => [...m.team1, ...m.team2]))).length;

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
                <button
                    onClick={() => setActiveTab("validering")}
                    className={`px-6 py-2 font-semibold transition ${activeTab === "validering"
                        ? "text-limecore border-b-2 border-limecore"
                        : "text-steelgrey hover:text-limecore"
                        }`}
                >
                    Validering
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
                                                            value={
                                                                editingValue !== null && focusedMatch === m.id && focusedTeam === 1
                                                                    ? editingValue
                                                                    : m.score[0] === undefined || m.score[0] === null || Number.isNaN(m.score[0])
                                                                        ? ""
                                                                        : m.score[0]
                                                            }
                                                            onFocus={() => {
                                                                setFocusedMatch(m.id);
                                                                setFocusedTeam(1);
                                                                setEditingValue(""); // töm initialt
                                                            }}
                                                            onBlur={() => {
                                                                setFocusedMatch(null);
                                                                setFocusedTeam(null);
                                                                setEditingValue(null); // avsluta edit-läge
                                                            }}
                                                            onChange={(e) => {
                                                                let val = e.target.value.replace(/[^0-9]/g, "");

                                                                // uppdatera edit-state så UI visar det du skriver
                                                                setEditingValue(val);

                                                                if (val === "") {
                                                                    updateScore(m.id, 1, "");
                                                                    updateScore(m.id, 2, "");
                                                                    return;
                                                                }

                                                                const num = Math.min(Number(val), pointsPerMatch);
                                                                const other = pointsPerMatch - num;

                                                                updateScore(m.id, 1, num);
                                                                updateScore(m.id, 2, other);
                                                            }}
                                                            placeholder={`0–${pointsPerMatch}`}
                                                            className={`w-16 bg-nightcourt border rounded-lg p-2 text-center text-courtwhite ${!isValid && total > 0 ? "border-red-500/60" : "border-steelgrey/30"
                                                                }`}
                                                        />


                                                        <span className="text-steelgrey font-bold">–</span>

                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={
                                                                editingValue !== null && focusedMatch === m.id && focusedTeam === 2
                                                                    ? editingValue
                                                                    : m.score[1] === undefined || m.score[1] === null || Number.isNaN(m.score[1])
                                                                        ? ""
                                                                        : m.score[1]
                                                            }
                                                            onFocus={() => {
                                                                setFocusedMatch(m.id);
                                                                setFocusedTeam(2);
                                                                setEditingValue("");
                                                            }}
                                                            onBlur={() => {
                                                                setFocusedMatch(null);
                                                                setFocusedTeam(null);
                                                                setEditingValue(null);
                                                            }}
                                                            onChange={(e) => {
                                                                let val = e.target.value.replace(/[^0-9]/g, "");

                                                                setEditingValue(val);

                                                                if (val === "") {
                                                                    updateScore(m.id, 2, "");
                                                                    updateScore(m.id, 1, "");
                                                                    return;
                                                                }

                                                                const num = Math.min(Number(val), pointsPerMatch);
                                                                const other = pointsPerMatch - num;

                                                                updateScore(m.id, 2, num);
                                                                updateScore(m.id, 1, other);
                                                            }}
                                                            placeholder={`0–${pointsPerMatch}`}
                                                            className={`w-16 bg-nightcourt border rounded-lg p-2 text-center text-courtwhite ${!isValid && total > 0 ? "border-red-500/60" : "border-steelgrey/30"
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

            {/* === VALIDERING === */}
            {activeTab === "validering" && validation && (
                <section className="space-y-6">
                    <h2 className="text-2xl font-semibold text-courtwhite mb-4 text-center">
                        Valideringsresultat
                    </h2>

                    {/* Status */}
                    <div className={`rounded-lg p-4 border-2 ${validation.valid
                        ? 'bg-green-900/20 border-green-500'
                        : 'bg-yellow-900/20 border-yellow-500'
                        }`}>
                        <div className="flex items-center gap-3">
                            {validation.valid ? (
                                <>
                                    <CheckCircle className="text-green-400" size={32} />
                                    <div>
                                        <div className="font-bold text-lg text-green-400">Perfekt schema!</div>
                                        <div className="text-green-300">Alla regler följs korrekt</div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="text-yellow-400" size={32} />
                                    <div>
                                        <div className="font-bold text-lg text-yellow-400">Schema med avvikelser</div>
                                        <div className="text-yellow-300">Vissa par möts oftare än optimalt</div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Statistik */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-nightcourt rounded-lg p-4 border border-steelgrey/20">
                            <h3 className="font-semibold text-lg mb-3 text-limecore">Allmän statistik</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-aquaserve">Totalt antal matcher:</span>
                                    <span className="font-bold text-limecore">{validation.stats.totalMatches}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-aquaserve">Max motståndarmöten:</span>
                                    <span className="font-bold text-limecore">{validation.stats.maxOpponentMeetings}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-aquaserve">Genomsnitt motståndarmöten:</span>
                                    <span className="font-bold text-limecore">{validation.stats.avgOpponentMeetings}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-nightcourt rounded-lg p-4 border border-steelgrey/20">
                            <h3 className="font-semibold text-lg mb-3 text-limecore">Fördelning motståndarmöten</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-aquaserve">Mötts 1 gång:</span>
                                    <span className="font-bold text-green-400">
                                        {validation.stats.opponentMeetingsDistribution.once} par
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-aquaserve">Mötts 2 gånger:</span>
                                    <span className="font-bold text-green-400">
                                        {validation.stats.opponentMeetingsDistribution.twice} par
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-aquaserve">Mötts 3 gånger:</span>
                                    <span className="font-bold text-yellow-400">
                                        {validation.stats.opponentMeetingsDistribution.thrice} par
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-aquaserve">Mötts &gt;3 gånger:</span>
                                    <span className="font-bold text-red-400">
                                        {validation.stats.opponentMeetingsDistribution.moreThanThrice} par
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Problem */}
                    {validation.issues.length > 0 && (
                        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                            <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
                                <XCircle size={20} />
                                Problem som hittades:
                            </h3>
                            <ul className="space-y-1 text-sm text-red-300 max-h-64 overflow-y-auto">
                                {validation.issues.map((issue, idx) => (
                                    <li key={idx}>• {issue}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Info om begränsningar */}
                    <div className="bg-nightcourt border border-steelgrey/20 rounded-lg p-4 text-sm text-aquaserve">
                        <strong className="text-limecore">ℹ️ Obs:</strong> Med {playerCount} spelare är det matematiskt omöjligt att hålla alla motståndarmöten under 3 gånger.
                        Algoritmen minimerar antalet möten så mycket som möjligt. Upp till 3 möten per par anses vara acceptabelt.
                    </div>
                </section>
            )}
        </div>
    );
}