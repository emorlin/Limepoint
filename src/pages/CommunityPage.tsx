
import { community } from "../data/communityData";

export default function CommunityPage() {


    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
            {/* HEADER */}
            <header>
                <h1 className="text-4xl font-display text-limecore mb-2">
                    {community.name}
                </h1>
                <p className="text-aquaserve">
                    Grundad {new Date(community.createdAt).toLocaleDateString("sv-SE")}
                </p>
                <p className="text-steelgrey mt-1">
                    {community.players.length} spelare • {community.tournaments.length} spelade turneringar
                </p>
            </header>

            {/* TURNERINGAR */}
            <section>
                <h2 className="text-2xl font-semibold text-courtwhite mb-3">
                    Turneringar
                </h2>
                <ul className="divide-y divide-steelgrey/20">
                    {community.tournaments.map((t) => (
                        <li
                            key={t.id}
                            className="py-3 flex justify-between hover:bg-limedark/10 px-2 rounded-lg transition"
                        >
                            <div>
                                <p className="text-limecore font-semibold">{t.name}</p>
                                <p className="text-steelgrey text-sm">
                                    {new Date(t.date).toLocaleDateString("sv-SE")}
                                </p>
                            </div>
                            <p className="text-aquaserve font-medium">
                                {t.matches.length} matcher
                            </p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
