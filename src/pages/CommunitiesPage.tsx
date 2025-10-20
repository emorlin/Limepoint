import CommunityLeaderboard from "../components/CommunityLeaderboard";
const communities = [
    { id: 1, name: "Sublime Slayers", tournaments: 14, lastPlayed: "2025-10-12" },
    { id: 2, name: "Södermalm Smashers", tournaments: 9, lastPlayed: "2025-10-05" },
    { id: 3, name: "Americano Crew", tournaments: 6, lastPlayed: "2025-09-30" },
    { id: 4, name: "Västerås Vibes", tournaments: 5, lastPlayed: "2025-09-15" },
];
export default function CommunitiesPage() {
    return (
        <>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-display text-limecore mb-4">Gemenskaper</h1>
                <p className="text-aquaserve">Alla padel-gemenksaper listade efter flest spelade turneringar</p>
                <p className="text-sm  mt-4 mb-4">En ny gemenskap skapar du samtidigt som du skapar en turnering.</p>
                <CommunityLeaderboard data={communities} />
            </div>

        </>
    );
}
