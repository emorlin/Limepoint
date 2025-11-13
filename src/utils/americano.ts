// utils/americano.ts

/**
 * Genererar ett korrekt Americano-schema där:
 * - Alla spelare spelar med varandra exakt en gång som partner
 * - Alla spelare möter varandra max 2 gånger som motståndare (helst 1 gång)
 */
export function generateAmericanoMatches(playerIds: string[]) {
    const n = playerIds.length;
    if (n % 4 !== 0) {
        throw new Error("Antalet spelare måste vara delbart med 4 (t.ex. 4, 8, 12, 16).");
    }

    // 🎲 Shuffla spelarna först för att få olika ordning varje gång
    const shuffledPlayers = [...playerIds].sort(() => Math.random() - 0.5);

    // Skapa alla möjliga par (utan ordning)
    const allPairs: [string, string][] = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            allPairs.push([shuffledPlayers[i], shuffledPlayers[j]]);
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

    // Håll koll på partners (får bara spela tillsammans en gång)
    const playedTogether = new Set<string>();

    // Håll koll på motståndare (får mötas max 2 gånger, helst 1)
    const playedAgainst = new Map<string, number>();

    const pairs = [...allPairs]; // Kopia att arbeta med
    let round = 1;
    let maxAttempts = 1000; // Undvik oändlig loop

    function getPairKey(a: string, b: string): string {
        return [a, b].sort().join("-");
    }

    function getOpponentCount(p1: string, p2: string, opp1: string, opp2: string): number {
        const pairs = [
            [p1, opp1],
            [p1, opp2],
            [p2, opp1],
            [p2, opp2],
        ];
        return pairs.reduce((sum, [a, b]) => {
            const key = getPairKey(a, b);
            return sum + (playedAgainst.get(key) || 0);
        }, 0);
    }

    function recordOpponents(p1: string, p2: string, opp1: string, opp2: string) {
        const pairs = [
            [p1, opp1],
            [p1, opp2],
            [p2, opp1],
            [p2, opp2],
        ];
        for (const [a, b] of pairs) {
            const key = getPairKey(a, b);
            playedAgainst.set(key, (playedAgainst.get(key) || 0) + 1);
        }
    }

    // Skapa matcher
    while (pairs.length > 0 && maxAttempts > 0) {
        maxAttempts--;
        const usedPlayers = new Set<string>();
        const roundPairs: [string, string, string, string][] = [];

        // Sortera par efter hur många gånger spelarna redan mött varandra som motståndare
        pairs.sort((a, b) => {
            const [a1, a2] = a;
            const [b1, b2] = b;

            // Räkna totala motståndarträffar för paret
            const aCount = Array.from(playedAgainst.entries())
                .filter(([key]) => key.includes(a1) || key.includes(a2))
                .reduce((sum, [, count]) => sum + count, 0);

            const bCount = Array.from(playedAgainst.entries())
                .filter(([key]) => key.includes(b1) || key.includes(b2))
                .reduce((sum, [, count]) => sum + count, 0);

            return aCount - bCount;
        });

        let i = 0;
        while (i < pairs.length) {
            const [a, b] = pairs[i];

            if (usedPlayers.has(a) || usedPlayers.has(b)) {
                i++;
                continue;
            }

            const partnerKey = getPairKey(a, b);
            if (playedTogether.has(partnerKey)) {
                i++;
                continue;
            }

            // Hitta bästa motståndarparet
            let bestOppIndex = -1;
            let bestOppScore = Infinity;

            for (let j = i + 1; j < pairs.length; j++) {
                const [c, d] = pairs[j];

                if (usedPlayers.has(c) || usedPlayers.has(d)) continue;
                if ([a, b].includes(c) || [a, b].includes(d)) continue;

                const oppCount = getOpponentCount(a, b, c, d);

                // Prioritera par som mött varandra färre gånger
                if (oppCount < bestOppScore) {
                    bestOppScore = oppCount;
                    bestOppIndex = j;
                }
            }

            if (bestOppIndex !== -1) {
                const [c, d] = pairs[bestOppIndex];
                roundPairs.push([a, b, c, d]);
                usedPlayers.add(a);
                usedPlayers.add(b);
                usedPlayers.add(c);
                usedPlayers.add(d);
                playedTogether.add(partnerKey);
                recordOpponents(a, b, c, d);

                pairs.splice(bestOppIndex, 1);
                pairs.splice(i, 1);
            } else {
                i++;
            }
        }

        if (roundPairs.length === 0) break;

        // Skapa matchobjekt
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

    // Slumpa ordning på spelare inom varje match
    for (const match of matches) {
        if (Math.random() > 0.5)
            [match.team1_player1, match.team1_player2] = [match.team1_player2, match.team1_player1];
        if (Math.random() > 0.5)
            [match.team2_player1, match.team2_player2] = [match.team2_player2, match.team2_player1];
    }

    // Slumpa ordning på matcherna per runda
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

/**
 * Validerar att schemat följer americano-reglerna
 */
export function validateAmericanoSchedule(matches: any[], playerIds: string[]) {
    const partnerCount = new Map<string, number>();
    const opponentCount = new Map<string, number>();

    function getPairKey(a: string, b: string): string {
        return [a, b].sort().join("-");
    }

    for (const match of matches) {
        const team1 = [match.team1_player1, match.team1_player2];
        const team2 = [match.team2_player1, match.team2_player2];

        // Räkna partners
        partnerCount.set(getPairKey(team1[0], team1[1]), (partnerCount.get(getPairKey(team1[0], team1[1])) || 0) + 1);
        partnerCount.set(getPairKey(team2[0], team2[1]), (partnerCount.get(getPairKey(team2[0], team2[1])) || 0) + 1);

        // Räkna motståndare
        for (const p1 of team1) {
            for (const p2 of team2) {
                const key = getPairKey(p1, p2);
                opponentCount.set(key, (opponentCount.get(key) || 0) + 1);
            }
        }
    }

    const issues: string[] = [];

    // Kontrollera partners (ska vara exakt 1)
    for (const [pair, count] of partnerCount.entries()) {
        if (count !== 1) {
            issues.push(`Par ${pair} har spelat tillsammans ${count} gånger (ska vara 1)`);
        }
    }

    // Kontrollera motståndare (max 2, helst 1)
    for (const [pair, count] of opponentCount.entries()) {
        if (count > 2) {
            issues.push(`Par ${pair} har mötts som motståndare ${count} gånger (max 2)`);
        }
    }

    return {
        valid: issues.length === 0,
        issues,
        stats: {
            totalMatches: matches.length,
            maxOpponentMeetings: Math.max(...Array.from(opponentCount.values())),
            avgOpponentMeetings: Array.from(opponentCount.values()).reduce((a, b) => a + b, 0) / opponentCount.size,
        },
    };
}
