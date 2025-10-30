// src/components/CommunityMedalLeague.tsx
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { getTournamentById } from "../lib/data/tournaments";
import { Trophy } from "lucide-react";

// === Typer i linje med TournamentPlayPage ===
type Match = {
    team1: string[];
    team2: string[];
    score: [number, number];
    confirmed?: boolean;
};

type TournamentFull = {
    id: string;
    name: string;
    community_id?: string;
    players?: string[];
    matches: Match[];
};

type MedalStats = {
    name: string;
    gold: number;
    silver: number;
    bronze: number;
};

function isUUID(s: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

export default function CommunityMedalLeague({ community }: { community: string }) {
    const [stats, setStats] = useState<MedalStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                // 1) Hitta community_id från prop (UUID / slug / name)
                let communityId: string | null = null;

                if (isUUID(community)) {
                    communityId = community;
                } else {
                    const { data: bySlug, error: slugErr } = await supabase
                        .from("communities")
                        .select("id")
                        .eq("slug", community)
                        .maybeSingle();

                    if (bySlug?.id) {
                        communityId = bySlug.id;
                    } else {
                        const { data: byName, error: nameErr } = await supabase
                            .from("communities")
                            .select("id")
                            .eq("name", community)
                            .maybeSingle();

                        if (byName?.id) communityId = byName.id;
                        if (!communityId && (slugErr || nameErr)) {
                            throw slugErr || nameErr!;
                        }
                    }
                }

                if (!communityId) {
                    setStats([]);
                    setLoading(false);
                    return;
                }

                // 2) Hämta turnerings-ID:n för communityt (OBS: inga antaganden om kolumner som inte finns)
                const { data: tournaments, error: tournErr } = await supabase
                    .from("tournaments")
                    .select("id, name, community_id")
                    .eq("community_id", communityId);

                if (tournErr) throw tournErr;
                if (!tournaments || tournaments.length === 0) {
                    setStats([]);
                    setLoading(false);
                    return;
                }

                // 3) För varje turnering, använd getTournamentById (samma logik som spelsidan)
                const medalMap: Record<string, MedalStats> = {};

                for (const t of tournaments as { id: string; name: string }[]) {
                    const full = (await getTournamentById(t.id)) as TournamentFull | null;
                    if (!full || !full.matches || full.matches.length === 0) continue;

                    // Bygg spelarlista från antingen players eller avlästa lag
                    const players =
                        full.players ??
                        Array.from(
                            new Set(
                                full.matches.flatMap((m) => [...(m.team1 || []), ...(m.team2 || [])]).filter(Boolean)
                            )
                        );

                    if (players.length === 0) continue;

                    // 4) Beräkna tabell: points → pd → wins (endast confirmed)
                    const playerStats = players.map((player) => {
                        let games = 0;
                        let wins = 0;
                        let pd = 0;
                        let totalPoints = 0;

                        full.matches.forEach(({ team1, team2, score, confirmed }) => {
                            if (!confirmed) return; // exakt samma villkor som turneringssidan
                            const [s1, s2] = score;
                            const isTeam1 = team1?.includes(player);
                            const isTeam2 = team2?.includes(player);
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

                    const ranked = [...playerStats].sort((a, b) => {
                        if (b.points !== a.points) return b.points - a.points;
                        if (b.pd !== a.pd) return b.pd - a.pd;
                        return b.wins - a.wins;
                    });

                    // 5) Tilldela OS-medaljer till topp 3
                    ranked.slice(0, 3).forEach((p, i) => {
                        if (!medalMap[p.name]) {
                            medalMap[p.name] = { name: p.name, gold: 0, silver: 0, bronze: 0 };
                        }
                        if (i === 0) medalMap[p.name].gold++;
                        else if (i === 1) medalMap[p.name].silver++;
                        else if (i === 2) medalMap[p.name].bronze++;
                    });
                }

                // 6) Sortera OS-stil
                const sorted = Object.values(medalMap).sort((a, b) => {
                    if (b.gold !== a.gold) return b.gold - a.gold;
                    if (b.silver !== a.silver) return b.silver - a.silver;
                    return b.bronze - a.bronze;
                });

                setStats(sorted);
            } catch (err) {
                console.error("❌ Fel vid hämtning av medaljliga:", err);
                setStats([]);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [community]);

    if (loading)
        return <div className="text-center text-steelgrey py-10">Laddar medaljliga...</div>;

    if (stats.length === 0)
        return <div className="text-center text-steelgrey py-10">Ingen medaljdata ännu.</div>;

    return (
        <section>
            <h2 className="text-2xl font-display text-limecore mb-4">  <Trophy className="text-limecore inline w-6 h-6 mr-1 -mt-1" />    Medaljliga</h2>
            <div className="bg-nightcourt rounded-2xl p-6 shadow-lg border border-steelgrey/20">
                <table className="w-full text-sm md:text-base border-collapse">
                    <thead className="text-steelgrey border-b border-steelgrey/30 uppercase text-xs tracking-wider">
                        <tr>
                            <th className="py-2 px-3 text-left">Spelare</th>
                            <th className="py-2 px-3 text-center">🥇</th>
                            <th className="py-2 px-3 text-center">🥈</th>
                            <th className="py-2 px-3 text-center">🥉</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((p, i) => (
                            <tr
                                key={p.name}
                                className="border-b border-steelgrey/20 hover:bg-limedark/10 transition"
                            >
                                <td className="py-2 px-3 flex items-center gap-2">
                                    <span className="w-5  text-limecore font-bold">{i + 1}</span>
                                    <span className="text-courtwhite font-medium truncate">{p.name}</span>
                                </td>
                                <td className="text-center text-yellow-400 font-semibold">{p.gold}</td>
                                <td className="text-center text-slate-300 font-semibold">{p.silver}</td>
                                <td className="text-center text-orange-500 font-semibold">{p.bronze}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
