// lib/data/tournaments.ts
import { supabase } from "../supabase";

// === Typer ===
type Player = {
    id: string;
    name: string;
};

type Match = {
    id?: string;
    round?: number;
    team1_player1?: Player | null;
    team1_player2?: Player | null;
    team2_player1?: Player | null;
    team2_player2?: Player | null;
    score1?: number | null;
    score2?: number | null;
};

type Community = {
    id: string;
    name: string;
    slug: string;
};

type Tournament = {
    id: string;
    name: string;
    created_at: string;
    points_per_match: number;
    communities?: Community | null;
    matches?: Match[] | null;
};

// === Hjälpfunktioner ===
const getPlayerName = (p: unknown): string => {
    if (!p) return "";
    if (typeof p === "string") return p;
    if (typeof p === "object" && "name" in p && typeof (p as any).name === "string") {
        return (p as any).name;
    }
    return "";
};

// === Statistikberäkning ===
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

// === Senaste turneringar ===
export async function getRecentTournaments(limit = 1000) {
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

    const formatted =
        (data as Tournament[] | null)?.map((t) => {
            const matches =
                (t.matches ?? []).map((m) => ({
                    team1: [getPlayerName(m.team1_player1), getPlayerName(m.team1_player2)].filter(Boolean),
                    team2: [getPlayerName(m.team2_player1), getPlayerName(m.team2_player2)].filter(Boolean),
                    score: [m.score1 ?? 0, m.score2 ?? 0] as [number, number],
                })) ?? [];

            const stats = calculateStats(matches);
            const top3 = stats.slice(0, 3).map((s) => s.name);

            return {
                id: t.id,
                name: t.name,
                date: t.created_at,
                community: t.communities?.name || "-",
                communitySlug: t.communities?.slug,
                pointsPerMatch: t.points_per_match,
                top3,
            };
        }) ?? [];

    return formatted;
}

// === Skapa ny turnering ===
export async function createTournament({
    name,
    communityId,
    pointsPerMatch,
}: {
    name: string;
    communityId: string;
    pointsPerMatch: number;
}) {
    const { data, error } = await supabase
        .from("tournaments")
        .insert([
            {
                name,
                community_id: communityId,
                points_per_match: pointsPerMatch,
            },
        ])
        .select()
        .single();

    if (error) {
        console.error("❌ Fel vid skapande av turnering:", error);
        throw error;
    }

    return data as Tournament;
}

// === Kontrollera att spelare finns, annars skapa ===
export async function ensurePlayer(name: string, communityId: string) {
    const { data: existing } = await supabase
        .from("players")
        .select("id")
        .eq("name", name)
        .eq("community_id", communityId)
        .maybeSingle();

    if (existing) return existing.id as string;

    const { data, error } = await supabase
        .from("players")
        .insert([{ name, community_id: communityId }])
        .select()
        .single();

    if (error) {
        console.error("❌ Fel vid skapande av spelare:", error);
        throw error;
    }

    return (data as { id: string }).id;
}

// === Hämta en turnering med alla matcher ===
export async function getTournamentById(id: string) {
    const { data, error } = await supabase
        .from("tournaments")
        .select(
            `
        id,
        name,
        points_per_match,
        communities ( name, slug ),
        matches (
            id,
            round,
            score1,
            score2,
            team1_player1:team1_player1 ( id, name ),
            team1_player2:team1_player2 ( id, name ),
            team2_player1:team2_player1 ( id, name ),
            team2_player2:team2_player2 ( id, name )
        )
        `
        )
        .eq("id", id)
        .maybeSingle();

    if (error || !data) {
        console.error("❌ Fel vid hämtning av turnering:", error);
        return null;
    }

    const tournament = data as Tournament;

    const matches =
        (tournament.matches ?? []).map((m) => ({
            id: m.id,
            round: m.round,
            team1: [m.team1_player1?.name, m.team1_player2?.name].filter(Boolean),
            team2: [m.team2_player1?.name, m.team2_player2?.name].filter(Boolean),
            score: [m.score1 ?? 0, m.score2 ?? 0] as [number, number],
            confirmed: (m.score1 ?? 0) + (m.score2 ?? 0) > 0,
        })) ?? [];

    return {
        id: tournament.id,
        name: tournament.name,
        community: tournament.communities?.name,
        pointsPerMatch: tournament.points_per_match,
        matches,
    };
}

// === Hämta turneringar för en specifik community ===
export async function getTournamentsByCommunity(communityId: string, limit = 20) {
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
        .eq("community_id", communityId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("❌ Fel vid hämtning av turneringar för community:", error);
        return [];
    }

    const formatted =
        (data as Tournament[] | null)?.map((t) => {
            const matches =
                (t.matches ?? []).map((m) => ({
                    team1: [getPlayerName(m.team1_player1), getPlayerName(m.team1_player2)].filter(Boolean),
                    team2: [getPlayerName(m.team2_player1), getPlayerName(m.team2_player2)].filter(Boolean),
                    score: [m.score1 ?? 0, m.score2 ?? 0] as [number, number],
                })) ?? [];

            const stats = calculateStats(matches);
            const top3 = stats.slice(0, 3).map((s) => s.name);

            return {
                id: t.id,
                name: t.name,
                date: t.created_at,
                community: t.communities?.name,
                communitySlug: t.communities?.slug,
                pointsPerMatch: t.points_per_match,
                top3,
            };
        }) ?? [];

    return formatted;
}
