import { supabase } from "../supabase";

// === Typdefinitioner ===
export type Community = {
    id: string;
    name: string;
    slug: string;
    created_at?: string;
    tournaments_count?: number;
    last_played?: string | null;
};

// === Hämta alla communities med turneringsstatistik ===
export async function getCommunities(): Promise<Community[]> {
    const { data, error } = await supabase.from("communities").select(`
    id,
    name,
    slug,
    created_at,
    tournaments (
      id,
      created_at
    )
  `);

    if (error) {
        console.error("❌ Fel vid hämtning av communities:", error);
        return [];
    }

    const formatted = (data || []).map((c: any) => {
        const tournaments = c.tournaments || [];
        const lastPlayed =
            tournaments.length > 0
                ? [...tournaments]
                      .map((t: any) => t.created_at)
                      .sort()
                      .reverse()[0]
                : null;

        return {
            id: c.id,
            name: c.name,
            slug: c.slug,
            created_at: c.created_at,
            tournaments_count: tournaments.length,
            last_played: lastPlayed,
        };
    });

    // Sortera efter flest turneringar (fall-back: senaste aktivitet)
    formatted.sort((a, b) => {
        const diff = (b.tournaments_count || 0) - (a.tournaments_count || 0);
        if (diff !== 0) return diff;
        return (b.last_played || "").localeCompare(a.last_played || "");
    });

    return formatted;
}

// === Hämta en community via ID (fallback) ===
export async function getCommunityById(id: string) {
    const { data, error } = await supabase
        .from("communities")
        .select(
            `
      id,
      name,
      slug,
      created_at,
      players ( id, name ),
      tournaments ( id, name, created_at, points_per_match )
    `
        )
        .eq("id", id)
        .single();

    if (error) {
        console.error("❌ Fel vid hämtning av community via ID:", error);
        return null;
    }

    return data;
}

// === Hämta community via slug (för /communities/:slug) ===

export async function fetchCommunityBySlug(slug: string) {
    const { data, error } = await supabase
        .from("communities")
        .select(
            `
      id,
      name,
      slug,
      created_at,
      players (
        id,
        name,
        active,
        created_at
      )
    `
        )
        .eq("slug", slug)
        .maybeSingle();

    if (error) {
        console.error("❌ Fel vid hämtning av gemenskap:", error);
        return null;
    }

    if (!data) return null;

    // ✅ Filtrera bort inaktiva spelare
    const activePlayers = (data.players || []).filter((p) => p.active !== false);

    return {
        ...data,
        players: activePlayers,
    };
}
