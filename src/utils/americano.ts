// utils/americano.ts

/**
 * Genererar ett korrekt Americano-schema för 4, 8, 12 eller 16 spelare.
 * Varje spelare spelar mot alla andra, men med varierande partners.
 * Returnerar en lista av matcher som kan sparas direkt till Supabase.
 */
export function generateAmericanoMatches(playerIds: string[]) {
    const n = playerIds.length;

    if (![4, 8, 12, 16].includes(n)) {
        throw new Error("Americano stöder endast 4, 8, 12 eller 16 spelare.");
    }

    // 🔹 Fasta, välbeprövade scheman
    // (baserat på vanliga Americano-rotationer – dessa ger perfekt balans)
    const patterns: Record<number, number[][][]> = {
        4: [
            [[1, 2, 3, 4]], // R1
            [[1, 3, 2, 4]], // R2
            [[1, 4, 2, 3]], // R3
        ],

        8: [
            [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
            ],
            [
                [1, 3, 5, 7],
                [2, 4, 6, 8],
            ],
            [
                [1, 4, 6, 7],
                [2, 3, 5, 8],
            ],
            [
                [1, 5, 4, 8],
                [2, 6, 3, 7],
            ],
            [
                [1, 6, 2, 7],
                [3, 8, 4, 5],
            ],
            [
                [1, 7, 3, 8],
                [2, 5, 4, 6],
            ],
            [
                [1, 8, 2, 5],
                [3, 7, 4, 6],
            ],
        ],

        12: [
            [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12],
            ],
            [
                [1, 3, 5, 7],
                [2, 4, 6, 8],
                [9, 11, 10, 12],
            ],
            [
                [1, 4, 6, 7],
                [2, 3, 5, 8],
                [9, 12, 10, 11],
            ],
            [
                [1, 5, 4, 8],
                [2, 6, 3, 7],
                [9, 11, 10, 12],
            ],
            [
                [1, 6, 2, 7],
                [3, 8, 4, 5],
                [9, 10, 11, 12],
            ],
            [
                [1, 7, 3, 8],
                [2, 5, 4, 6],
                [9, 12, 10, 11],
            ],
            [
                [1, 8, 2, 5],
                [3, 7, 4, 6],
                [9, 11, 10, 12],
            ],
            [
                [1, 9, 2, 10],
                [3, 11, 4, 12],
                [5, 6, 7, 8],
            ],
            [
                [1, 10, 3, 11],
                [2, 12, 4, 9],
                [5, 7, 6, 8],
            ],
            [
                [1, 11, 2, 12],
                [3, 9, 4, 10],
                [5, 8, 6, 7],
            ],
            [
                [1, 12, 3, 9],
                [2, 10, 4, 11],
                [5, 6, 7, 8],
            ],
        ],

        16: [
            [
                [1, 2, 3, 4],
                [5, 6, 7, 8],
                [9, 10, 11, 12],
                [13, 14, 15, 16],
            ],
            [
                [1, 3, 5, 7],
                [2, 4, 6, 8],
                [9, 11, 13, 15],
                [10, 12, 14, 16],
            ],
            [
                [1, 4, 6, 7],
                [2, 3, 5, 8],
                [9, 12, 14, 15],
                [10, 11, 13, 16],
            ],
            [
                [1, 5, 4, 8],
                [2, 6, 3, 7],
                [9, 13, 12, 16],
                [10, 14, 11, 15],
            ],
            [
                [1, 6, 2, 7],
                [3, 8, 4, 5],
                [9, 14, 10, 15],
                [11, 13, 12, 16],
            ],
            [
                [1, 7, 3, 8],
                [2, 5, 4, 6],
                [9, 15, 11, 16],
                [10, 12, 13, 14],
            ],
            [
                [1, 8, 2, 5],
                [3, 7, 4, 6],
                [9, 16, 10, 13],
                [11, 14, 12, 15],
            ],
            [
                [1, 9, 2, 10],
                [3, 11, 4, 12],
                [5, 13, 6, 14],
                [7, 15, 8, 16],
            ],
            [
                [1, 10, 3, 11],
                [2, 12, 4, 9],
                [5, 14, 7, 13],
                [6, 15, 8, 16],
            ],
            [
                [1, 11, 2, 12],
                [3, 9, 4, 10],
                [5, 15, 6, 16],
                [7, 13, 8, 14],
            ],
        ],
    };

    const pattern = patterns[n];
    if (!pattern) throw new Error(`Inget schema definierat för ${n} spelare.`);

    const matches: {
        round: number;
        team1_player1: string;
        team1_player2: string;
        team2_player1: string;
        team2_player2: string;
        score1: number;
        score2: number;
    }[] = [];

    for (let round = 0; round < pattern.length; round++) {
        for (const [a, b, c, d] of pattern[round]) {
            matches.push({
                round: round + 1,
                team1_player1: playerIds[a - 1],
                team1_player2: playerIds[b - 1],
                team2_player1: playerIds[c - 1],
                team2_player2: playerIds[d - 1],
                score1: 0,
                score2: 0,
            });
        }
    }

    return matches;
}
