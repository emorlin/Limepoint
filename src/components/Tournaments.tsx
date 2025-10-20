import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

export default function Tournaments({ data }: { data: any[] }) {
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
                            <th className="py-2">Gemenskap</th>
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
                                {/* 🔗 Klickbart namn */}
                                <td className="py-3 font-semibold text-courtwhite">
                                    <Link
                                        to={`/tournaments/${t.id}`}
                                        className="text-limecore hover:underline"
                                    >
                                        {t.name}
                                    </Link>
                                </td>

                                <td className="py-3 text-steelgrey">{t.community}</td>

                                <td className="py-3 text-aquaserve text-sm">
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

                                <td className="py-3 text-right text-steelgrey">
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
