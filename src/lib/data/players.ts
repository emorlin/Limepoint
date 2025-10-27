import { supabase } from "../supabase";

export async function fetchPlayersByCommunity(communityId: string, includeInactive = false) {
    const q = supabase
        .from("players")
        .select("id, name, active, created_at")
        .eq("community_id", communityId)
        .order("name", { ascending: true });

    if (!includeInactive) q.eq("active", true);

    const { data, error } = await q;
    if (error) {
        console.error("❌ Fel vid hämtning av spelare:", error);
        throw error;
    }
    return data ?? [];
}

export async function deactivatePlayer(playerId: string) {
    const { data, error } = await supabase
        .from("players")
        .update({ active: false })
        .eq("id", playerId)
        .select("id, name, active")
        .single(); // få tillbaka raden för säkerhets skull

    if (error) {
        console.error("❌ Fel vid avaktivering av spelare:", error);
        throw error;
    }
    return data;
}
