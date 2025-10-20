import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";
type Props = {
    data: any[];
    showCommunity?: boolean; // ny prop
};

export default function Tournaments({ data, showCommunity = true }: Props) {
    return (
        <section className="bg-nightcourt rounded-2xl p-6 shadow-lg border border-steelgrey/20">
            <div className="flex items-center gap-2 mb-6">
                <Calendar className="text-limecore w-6 h-6" />
                <h2 className="text-xl font-display font-bold text-courtwhite">
                    Senaste turneringar
                </h2>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm md:text-base">
                    <thead>
                        <tr className="border-b border-steelgrey/30 text-steelgrey uppercase text-xs tracking-wider">
                            <th className="py-2">Turnering</th>
                            {showCommunity && <th className="py-2">Gemenskap</th>}
                            <th className="py-2">Topp 3</th>
                            <th className="py-2 text-right">Datum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((t) => (
                            <tr
                                key={t.id}
                                className="border-b border-steelgrey/20 hover:bg-limedark/10 transition"
                            >
                                <td className="py-3 font-semibold text-courtwhite whitespace-nowrap pr-4">
                                    <Link
                                        to={`/tournaments/${t.id}`}
                                        className="font-semibold text-courtwhite underline hover:text-limecore transition"
                                    >
                                        {t.name}
                                    </Link>
                                </td>

                                {showCommunity && (
                                    <td className="py-3 text-steelgrey whitespace-nowrap  pr-4">
                                        {t.community?.trim() && t.community}
                                    </td>
                                )}

                                <td className="py-3 text-aquaserve text-sm whitespace-nowrap  pr-4">
                                    {t.top3.map((player: string, i: number) => {
                                        const medalColors = [
                                            "text-yellow-400",
                                            "text-gray-300",
                                            "text-amber-600",
                                        ];
                                        return (
                                            <span
                                                key={i}
                                                className="mr-4 flex items-center inline-flex"
                                            >
                                                <span className={`${medalColors[i]} mr-1`}>
                                                    {["🥇", "🥈", "🥉"][i]}
                                                </span>
                                                <span className="text-aquaserve">{player}</span>
                                            </span>
                                        );
                                    })}
                                </td>

                                <td className="py-3 text-right text-steelgrey whitespace-nowrap">
                                    {new Date(t.date).toLocaleDateString("sv-SE", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
