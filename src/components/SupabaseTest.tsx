import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function SupabaseTest() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                // 🔹 Testa att hämta något enkelt, t.ex. communities
                const { data, error } = await supabase
                    .from("communities")
                    .select("*")
                    .limit(5);

                if (error) throw error;
                setData(data || []);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <p className="text-steelgrey">Laddar...</p>;
    if (error) return <p className="text-red-400">Fel: {error}</p>;

    return (
        <div className="bg-nightcourt border border-steelgrey/30 rounded-xl p-4 mt-8">
            <h2 className="text-limecore text-xl font-semibold mb-3">
                🔌 Supabase-test
            </h2>
            {data.length > 0 ? (
                <ul className="space-y-1 text-courtwhite">
                    {data.map((c) => (
                        <li key={c.id}>
                            {c.name} <span className="text-steelgrey">({c.id})</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-steelgrey">Inga communities hittades.</p>
            )}
        </div>
    );
}
