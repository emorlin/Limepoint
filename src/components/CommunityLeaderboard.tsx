import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
export default function CommunityLeaderboard({ data }: { data: any[] }) {
    return (
        <section className="bg-nightcourt rounded-2xl p-6 shadow-lg border border-steelgrey/20">
            <div className="flex items-center gap-2 mb-6">
                <Trophy className="text-limecore w-6 h-6" />
                <h2 className="text-xl font-display font-bold text-courtwhite">
                    Toppgemenskaper
                </h2>
            </div>

            <ul className="divide-y divide-steelgrey/20">
                {data.map((c, i) => (
                    <li
                        key={c.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-1 hover:bg-limedark/10 rounded-lg transition"
                    >
                        <div className="flex items-center gap-4">
                            <span className="text-limecore font-bold text-lg w-6 text-center">
                                {i + 1}
                            </span>

                            <Link className="font-semibold text-courtwhite underline hover:text-limecore transition" to="/communities/1"> {c.name}</Link>


                        </div>

                        <div className="flex items-center gap-6 pl-10 pt-1 sm:pt-0 sm:pl-0 text-sm text-steelgrey">
                            <span className="text-aquaserve font-medium">
                                {c.tournaments} turneringar
                            </span>
                            <span>{new Date(c.lastPlayed).toLocaleDateString("sv-SE")}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
}
