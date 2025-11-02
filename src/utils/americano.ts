// utils/americano.ts

/**
 * Genererar ett korrekt och varierat Americano-schema.
 * - Inga spelare har samma partner mer än en gång.
 * - Ordningen på matcher och spelare roteras för variation.
 */
export function generateAmericanoMatches(playerIds: string[]) {
    const n = playerIds.length;
    if (n % 4 !== 0) {
        throw new Error("Antalet spelare måste vara delbart med 4 (t.ex. 4, 8, 12, 16).");
    }

    // 🔹 skapa alla möjliga par (utan ordning)
    const pairs: [string, string][] = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            pairs.push([playerIds[i], playerIds[j]]);
        }
    }

    const matches: {
        round: number;
        team1_player1: string;
        team1_player2: string;
        team2_player1: string;
        team2_player2: string;
        score1: number;
        score2: number;
    }[] = [];

    const playedTogether = new Set<string>();
    let round = 1;

    // 🔹 skapa matcher
    while (pairs.length > 0) {
        const usedPlayers = new Set<string>();
        const roundPairs: [string, string, string, string][] = [];

        let i = 0;
        while (i < pairs.length) {
            const [a, b] = pairs[i];
            if (usedPlayers.has(a) || usedPlayers.has(b)) {
                i++;
                continue;
            }

            const key = [a, b].sort().join("-");
            if (playedTogether.has(key)) {
                i++;
                continue;
            }

            const oppIndex = pairs.findIndex(
                ([c, d], idx) =>
                    idx > i && !usedPlayers.has(c) && !usedPlayers.has(d) && ![a, b].includes(c) && ![a, b].includes(d)
            );

            if (oppIndex !== -1) {
                const [c, d] = pairs[oppIndex];
                roundPairs.push([a, b, c, d]);
                usedPlayers.add(a);
                usedPlayers.add(b);
                usedPlayers.add(c);
                usedPlayers.add(d);
                playedTogether.add(key);
                pairs.splice(oppIndex, 1);
                pairs.splice(i, 1);
            } else {
                i++;
            }
        }

        if (roundPairs.length === 0) break;

        // 🔸 skapa matchobjekt
        for (const [a, b, c, d] of roundPairs) {
            matches.push({
                round,
                team1_player1: a,
                team1_player2: b,
                team2_player1: c,
                team2_player2: d,
                score1: 0,
                score2: 0,
            });
        }

        round++;
    }

    // 🌀 NYTT: slumpa ordning på spelare inom varje match
    for (const match of matches) {
        if (Math.random() > 0.5)
            [match.team1_player1, match.team1_player2] = [match.team1_player2, match.team1_player1];
        if (Math.random() > 0.5)
            [match.team2_player1, match.team2_player2] = [match.team2_player2, match.team2_player1];
    }

    // 🌀 NYTT: slumpa ordning på matcherna per runda
    const maxRound = Math.max(...matches.map((m) => m.round));
    for (let r = 1; r <= maxRound; r++) {
        const roundMatches = matches.filter((m) => m.round === r);
        roundMatches.sort(() => Math.random() - 0.5);
        const startIndex = matches.findIndex((m) => m.round === r);
        for (let i = 0; i < roundMatches.length; i++) {
            matches[startIndex + i] = roundMatches[i];
        }
    }

    return matches;
}
