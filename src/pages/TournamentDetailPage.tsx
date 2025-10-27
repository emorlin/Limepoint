import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

type Match = {
    round: number;
    team1: string[];
    team2: string[];
    score: [number, number];
};

export default function TournamentDetailPage() {
    const { id } = useParams();
    const [tournament, setTournament] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"schema" | "tabell">("schema");
    const [activeRound, setActiveRound] = useState(1);

    // 🟢 Hämta turnering + matcher från Supabase
    useEffect(() => {
        async function fetchTournament() {
            const { data, error } = await supabase
                .from("tournaments")
                .select(`
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
        `)
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

            const formattedMatches: Match[] = (data.matches || []).map((m: any) => ({
                round: m.round || 1,
                team1: [m.team1_player1?.name, m.team1_player2?.name].filter(Boolean),
                team2: [m.team2_player1?.name, m.team2_player2?.name].filter(Boolean),
                score: [m.score1 ?? 0, m.score2 ?? 0],
            }));

            const allPlayers = Array.from(
                new Set(
                    formattedMatches.flatMap((m) => [...m.team1, ...m.team2])
                )
            );

            setTournament({
                id: data.id,
                name: data.name,
                community: data.communities?.name || "-",
                date: data.created_at,
                pointsPerMatch: data.points_per_match,
                players: allPlayers,
                matches: formattedMatches,
            });

            setLoading(false);
        }

        if (id) fetchTournament();
    }, [id]);

    // 🧮 Gruppérar matcher per runda
    const rounds = useMemo(() => {
        if (!tournament) return {};
        return tournament.matches.reduce(
            (acc: Record<number, Match[]>, match: Match) => {
                acc[match.round] = acc[match.round] || [];
                acc[match.round].push(match);
                return acc;
            },
            {}
        );
    }, [tournament]);

    if (loading)
        return (
            <div className="max-w-4xl mx-auto text-steelgrey">Laddar turnering...</div>
        );

    if (error)
        return (
            <div className="max-w-4xl mx-auto text-red-400">{error}</div>
        );

    if (!tournament) return null;

    // === BERÄKNA STATISTIK ===
    const stats = tournament.players.map((player: string) => {
        let games = 0;
        let wins = 0;
        let pd = 0;
        let totalPoints = 0;

        tournament.matches.forEach(({ team1, team2, score }: Match) => {
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

    const sorted = stats.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pd !== a.pd) return b.pd - a.pd;
        return b.wins - a.wins;
    });

    // === UI ===
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* HEADER */}
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">
                    {tournament.name}
                </h1>
                <p className="text-aquaserve text-lg">
                    {tournament.community} •{" "}
                    {new Date(tournament.date).toLocaleDateString("sv-SE")}
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
        </div>
    );
}
