export function calculateTop3(matches: any[], players: string[]) {
    if (!matches?.length || !players?.length) return [];

    const stats = players.map((player) => {
        let games = 0,
            wins = 0,
            pd = 0,
            points = 0;

        matches.forEach(({ team1, team2, score }) => {
            const [s1, s2] = score || [0, 0];
            const isT1 = team1.includes(player);
            const isT2 = team2.includes(player);
            if (isT1 || isT2) {
                games++;
                const own = isT1 ? s1 : s2;
                const opp = isT1 ? s2 : s1;
                points += own;
                pd += own - opp;
                if (own > opp) wins++;
            }
        });

        return { name: player, games, wins, pd, points };
    });

    const sorted = stats.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.pd !== a.pd) return b.pd - a.pd;
        return b.wins - a.wins;
    });

    return sorted.slice(0, 3).map((s) => s.name);
}
