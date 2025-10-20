import { useMemo, useState } from "react";

export default function TournamentDetailPage() {
    const [activeTab, setActiveTab] = useState<"schema" | "tabell">("schema");
    const [activeRound, setActiveRound] = useState(1);

    const tournament = {
        id: 1,
        name: "Sublime Americano #1",
        community: "Sublime Slayers",
        date: "2025-10-19",
        pointsPerMatch: 16,
        players: [
            "Erik",
            "Tomas",
            "Mathias",
            "Anna",
            "Jonas",
            "Micke",
            "Karin",
            "Alex",
        ],
        matches: [
            { round: 1, team1: ["Erik", "Tomas"], team2: ["Anna", "Jonas"], score: [9, 7] },
            { round: 1, team1: ["Mathias", "Karin"], team2: ["Micke", "Alex"], score: [8, 8] },
            { round: 2, team1: ["Erik", "Anna"], team2: ["Mathias", "Jonas"], score: [10, 6] },
            { round: 2, team1: ["Tomas", "Micke"], team2: ["Karin", "Alex"], score: [11, 5] },
            { round: 3, team1: ["Erik", "Micke"], team2: ["Tomas", "Karin"], score: [8, 8] },
            { round: 3, team1: ["Anna", "Alex"], team2: ["Jonas", "Mathias"], score: [9, 7] },
            { round: 4, team1: ["Erik", "Jonas"], team2: ["Mathias", "Karin"], score: [10, 6] },
            { round: 4, team1: ["Tomas", "Alex"], team2: ["Anna", "Micke"], score: [9, 7] },
            { round: 5, team1: ["Erik", "Karin"], team2: ["Tomas", "Mathias"], score: [11, 5] },
            { round: 5, team1: ["Anna", "Jonas"], team2: ["Micke", "Alex"], score: [8, 8] },
            { round: 6, team1: ["Erik", "Alex"], team2: ["Tomas", "Anna"], score: [10, 6] },
            { round: 6, team1: ["Mathias", "Micke"], team2: ["Jonas", "Karin"], score: [7, 9] },
            { round: 7, team1: ["Erik", "Mathias"], team2: ["Jonas", "Micke"], score: [8, 8] },
            { round: 7, team1: ["Tomas", "Karin"], team2: ["Anna", "Alex"], score: [9, 7] },
        ],
    };

    // Gruppérar matcher per runda
    const rounds = useMemo(() => {
        return tournament.matches.reduce(
            (acc: Record<number, typeof tournament.matches>, match) => {
                acc[match.round] = acc[match.round] || [];
                acc[match.round].push(match);
                return acc;
            },
            {}
        );
    }, [tournament]);

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

            {/* TABBAR (Schema / Tabell) */}
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
                    {/* RUNDA-FLIKAR */}
                    <nav className="flex justify-center gap-2 mb-6 flex-wrap">
                        {Array.from({ length: 7 }, (_, i) => i + 1).map((num) => (
                            <button
                                key={num}
                                onClick={() => setActiveRound(num)}
                                className={`w-10 h-10 rounded-full border-2 transition font-semibold ${activeRound === num
                                    ? "border-limecore text-limecore bg-limecore/10"
                                    : "border-steelgrey/40 text-steelgrey hover:border-limecore/40 hover:text-limecore"
                                    }`}
                            >
                                {num}
                            </button>
                        ))}
                    </nav>

                    {/* MATCHER FÖR AKTIV RUNDA */}
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
                                    {/* Lag 1 */}
                                    <div className="flex flex-col items-start sm:items-end w-1/3 text-right">
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
                                        <div className="text-3xl font-bold text-limecore whitespace-nowrap">
                                            {m.score[0]}{" "}
                                            <span className="text-steelgrey text-xl">vs</span>{" "}
                                            {m.score[1]}
                                        </div>
                                        <div className="text-xs text-steelgrey mt-1">
                                            till {tournament.pointsPerMatch}
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
                                    <th
                                        className="py-2 px-3 text-center relative group"
                                        title="Spelade / Vinster"
                                    >
                                        G/W
                                        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden group-hover:block text-[11px] text-steelgrey bg-nightcourt border border-steelgrey/40 px-2 py-1 rounded-md whitespace-nowrap z-10">
                                            Spelade / Vinster
                                        </span>
                                    </th>
                                    <th className="py-2 px-3 text-center">PD</th>
                                    <th className="py-2 px-3 text-center">Poäng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // 🔢 Beräkna statistik för varje spelare
                                    const stats = tournament.players.map((player) => {
                                        let games = 0;
                                        let wins = 0;
                                        let pd = 0;
                                        let totalPoints = 0;

                                        tournament.matches.forEach(({ team1, team2, score }) => {
                                            const [s1, s2] = score;
                                            const isTeam1 = team1.includes(player);
                                            const isTeam2 = team2.includes(player);
                                            if (isTeam1 || isTeam2) {
                                                // ✅ En match spelad
                                                games += 1;
                                                const own = isTeam1 ? s1 : s2;
                                                const opp = isTeam1 ? s2 : s1;
                                                totalPoints += own;
                                                pd += own - opp;
                                                if (own > opp) wins++;
                                            }
                                        });

                                        return { name: player, games, wins, pd, points: totalPoints };
                                    });

                                    // 🔽 Sortera efter poäng → PD → vinster
                                    const sorted = stats.sort((a, b) => {
                                        if (b.points !== a.points) return b.points - a.points;
                                        if (b.pd !== a.pd) return b.pd - a.pd;
                                        return b.wins - a.wins;
                                    });

                                    return sorted.map((p, i) => (
                                        <tr
                                            key={p.name}
                                            className="border-b border-steelgrey/20 hover:bg-limedark/10 transition"
                                        >
                                            {/* Nummer + Namn */}
                                            <td className="flex items-center gap-3 py-3 px-3">
                                                <span className="w-5 text-right text-limecore font-bold">
                                                    {i + 1}
                                                </span>
                                                <span className="font-medium text-courtwhite truncate">
                                                    {p.name}
                                                </span>
                                            </td>

                                            {/* G/W */}
                                            <td className="text-center text-aquaserve font-semibold">
                                                {p.games}/{p.wins}
                                            </td>

                                            {/* PD */}
                                            <td
                                                className={`text-center font-medium ${p.pd >= 0 ? "text-limecore" : "text-red-400"
                                                    }`}
                                            >
                                                {p.pd > 0 ? `+${p.pd}` : p.pd}
                                            </td>

                                            {/* Totala poäng */}
                                            <td className="text-center text-courtwhite font-semibold">
                                                {p.points}
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
