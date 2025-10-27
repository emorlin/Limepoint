// lib/data/tournaments.ts
import { supabase } from "../supabase";

const getPlayerName = (p: any): string =>
    typeof p === "string" ? p : p?.name?.name || p?.name || p?.player_name || p?.full_name || "";

// Räknar tabell utifrån normaliserade matcher (namn, inte objekt)
function calculateStats(matches: { team1: string[]; team2: string[]; score: [number, number] }[]) {
    const stats: Record<string, { points: number; pd: number; wins: number }> = {};

    matches.forEach((m) => {
        const [s1, s2] = m.score;

        m.team1.forEach((name) => {
            if (!stats[name]) stats[name] = { points: 0, pd: 0, wins: 0 };
            stats[name].points += s1;
            stats[name].pd += s1 - s2;
            if (s1 > s2) stats[name].wins++;
        });

        m.team2.forEach((name) => {
            if (!stats[name]) stats[name] = { points: 0, pd: 0, wins: 0 };
            stats[name].points += s2;
            stats[name].pd += s2 - s1;
            if (s2 > s1) stats[name].wins++;
        });
    });

    return Object.entries(stats)
        .map(([name, s]) => ({ name, ...s }))
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.pd !== a.pd) return b.pd - a.pd;
            return b.wins - a.wins;
        });
}

export async function getRecentTournaments(limit = 5) {
    const { data, error } = await supabase
        .from("tournaments")
        .select(
            `
      id,
      name,
      created_at,
      points_per_match,
      communities ( id, name, slug ),
      matches (
        team1_player1:team1_player1 ( id, name ),
        team1_player2:team1_player2 ( id, name ),
        team2_player1:team2_player1 ( id, name ),
        team2_player2:team2_player2 ( id, name ),
        score1,
        score2
      )
    `
        )
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("❌ Fel vid hämtning av turneringar:", error);
        return [];
    }

    const formatted = (data || []).map((t) => {
        // Normalisera matcher till { team1: string[], team2: string[], score: [n,n] }
        const matches = (t.matches || []).map((m: any) => ({
            team1: [getPlayerName(m.team1_player1), getPlayerName(m.team1_player2)].filter(Boolean),
            team2: [getPlayerName(m.team2_player1), getPlayerName(m.team2_player2)].filter(Boolean),
            score: [m.score1 ?? 0, m.score2 ?? 0] as [number, number],
        }));

        const stats = calculateStats(matches);
        const top3 = stats.slice(0, 3).map((s) => s.name); // 🔹 alltid rena namn

        return {
            id: t.id,
            name: t.name,
            date: t.created_at,
            community: t.communities?.name || "-",
            communitySlug: t.communities?.slug,
            pointsPerMatch: t.points_per_match,
            top3, // ✅ strängar
        };
    });

    return formatted;
}
