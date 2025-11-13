// src/pages/TournamentDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

// === Typer ===
type PlayerName = string;

type Match = {
    round: number;
    team1: PlayerName[];
    team2: PlayerName[];
    score: [number, number];
};

type Tournament = {
    id: string;
    name: string;
    community: string;
    date: string;
    pointsPerMatch: number;
    players: PlayerName[];
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
function validateAmericanoSchedule(matches: Match[], players: PlayerName[]): ValidationResult {
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
export default function TournamentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"schema" | "tabell" | "validering">("schema");
    const [activeRound, setActiveRound] = useState<number>(1);
    const [validation, setValidation] = useState<ValidationResult | null>(null);

    // === Hämta turnering + matcher ===
    useEffect(() => {
        const fetchTournament = async (): Promise<void> => {
            const { data, error } = await supabase
                .from("tournaments")
                .select(
                    `
          id,
          name,
          created_at,
          points_per_match,
          communities ( name ),
          matches (
            round,
            score1,
            score2,
            team1_player1:team1_player1 ( name ),
            team1_player2:team1_player2 ( name ),
            team2_player1:team2_player1 ( name ),
            team2_player2:team2_player2 ( name )
          )
        `
                )
                .eq("id", id)
                .maybeSingle();

            if (error) {
                console.error("❌ Fel vid hämtning av turnering:", error);
                setError("Kunde inte ladda turnering.");
                setLoading(false);
                return;
            }

            if (!data) {
                setError("Ingen turnering hittades.");
                setLoading(false);
                return;
            }

            // Typa data säkert
            const formattedMatches: Match[] = ((data as any).matches ?? []).map(
                (m: any) => ({
                    round: m.round || 1,
                    team1: [m.team1_player1?.name, m.team1_player2?.name].filter(
                        Boolean
                    ) as PlayerName[],
                    team2: [m.team2_player1?.name, m.team2_player2?.name].filter(
                        Boolean
                    ) as PlayerName[],
                    score: [m.score1 ?? 0, m.score2 ?? 0],
                })
            );

            const allPlayers = Array.from(
                new Set(formattedMatches.flatMap((m) => [...m.team1, ...m.team2]))
            );

            const tournamentData = {
                id: (data as any).id,
                name: (data as any).name,
                community: (data as any).communities?.name || "-",
                date: (data as any).created_at,
                pointsPerMatch: (data as any).points_per_match,
                players: allPlayers,
                matches: formattedMatches,
            };

            setTournament(tournamentData);

            // Kör validering
            if (formattedMatches.length > 0 && allPlayers.length > 0) {
                const validationResult = validateAmericanoSchedule(formattedMatches, allPlayers);
                setValidation(validationResult);
            }

            setLoading(false);
        };

        if (id) void fetchTournament();
    }, [id]);

    // === Gruppérar matcher per runda ===
    const rounds = useMemo<Record<number, Match[]>>(() => {
        if (!tournament) return {};
        return tournament.matches.reduce<Record<number, Match[]>>((acc, match) => {
            acc[match.round] = acc[match.round] || [];
            acc[match.round].push(match);
            return acc;
        }, {});
    }, [tournament]);

    // === Laddning & fel ===
    if (loading)
        return (
            <div className="max-w-4xl mx-auto text-steelgrey">
                Laddar turnering...
            </div>
        );

    if (error)
        return <div className="max-w-4xl mx-auto text-red-400">{error}</div>;

    if (!tournament) return null;

    // === Beräkna statistik ===
    const stats = tournament.players.map((player) => {
        let games = 0;
        let wins = 0;
        let pd = 0;
        let points = 0;

        tournament.matches.forEach(({ team1, team2, score }) => {
            const [s1, s2] = score;
            const isTeam1 = team1.includes(player);
            const isTeam2 = team2.includes(player);

            if (isTeam1 || isTeam2) {
                games++;
                const own = isTeam1 ? s1 : s2;
                const opp = isTeam1 ? s2 : s1;
                points += own;
                pd += own - opp;
                if (own > opp) wins++;
            }
        });

        return { name: player, games, wins, pd, points };
    });

    const sorted = [...stats].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pd !== a.pd) return b.pd - a.pd;
        return b.wins - a.wins;
    });

    // === UI ===
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* HEADER */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-4xl font-display text-limecore mb-2 sm:mb-0">
                        {tournament.name}
                    </h1>
                    <p className="text-aquaserve text-lg">
                        {tournament.community} •{" "}
                        {new Date(tournament.date).toLocaleDateString("sv-SE")}
                    </p>
                </div>

                {/* 🔹 Gå till spela-vyn */}
                <button
                    onClick={() => navigate(`/tournaments/play/${tournament.id}`)}
                    className="text-steelgrey hover:text-limecore text-sm font-medium border border-steelgrey/30 hover:border-limecore/40 rounded-lg px-3 py-1 mt-3 sm:mt-0 transition"
                >
                    Ändra resultat
                </button>
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
                    {/* Runda-väljare */}
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

                    {/* Matcher */}
                    <section>
                        <h2 className="text-2xl font-semibold text-courtwhite mb-4 text-center">
                            Omgång {activeRound}
                        </h2>

                        <div className="space-y-6">
                            {rounds[activeRound]?.map((m, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-center gap-6 bg-nightcourt border border-steelgrey/20 rounded-2xl p-4"
                                >
                                    {/* Team 1 */}
                                    <div className="flex flex-col items-end w-1/3 text-right">
                                        {m.team1.map((p) => (
                                            <span
                                                key={p}
                                                className="text-courtwhite text-sm font-medium"
                                            >
                                                {p}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Result */}
                                    <div className="flex flex-col items-center justify-center w-1/3">
                                        <div className="text-3xl font-bold text-limecore whitespace-nowrap">
                                            {m.score[0]}{" "}
                                            <span className="text-steelgrey text-xl">vs</span>{" "}
                                            {m.score[1]}
                                        </div>
                                        <div className="text-xs text-steelgrey mt-1">
                                            till {tournament.pointsPerMatch}
                                        </div>
                                    </div>

                                    {/* Team 2 */}
                                    <div className="flex flex-col items-start w-1/3 text-left">
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
                            ))}
                        </div>
                    </section>
                </>
            )}

            {/* === TABELL === */}
            {activeTab === "tabell" && (
                <section>
                    <h2 className="text-2xl font-semibold text-courtwhite mb-4 text-center">
                        Slutställning
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
                        <strong className="text-limecore">ℹ️ Obs:</strong> Med {tournament.players.length} spelare är det matematiskt omöjligt att hålla alla motståndarmöten under 3 gånger.
                        Algoritmen minimerar antalet möten så mycket som möjligt.
                    </div>
                </section>
            )}
        </div>
    );
}