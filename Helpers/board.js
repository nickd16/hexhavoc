class Tile {
    constructor(id, row, col, q, r) {
        this.id = id;
        this.row = row;
        this.col = col;
        this.q = q;
        this.r = r;
        this.occupant = null;
        this.board;
    }
}

class Board {
    static axialDirections = [
        { q: +1, r:  0 }, { q: +1, r: -1 }, { q:  0, r: -1 },
        { q: -1, r:  0 }, { q: -1, r: +1 }, { q:  0, r: +1 }
    ];

    constructor() {
        this.shape = [7, 8, 9, 10, 9, 10, 9, 10, 9, 8, 7];
        this.tiles = [];
        this.coordMap = {};
        this.buildBoard();
        this.game;
    }

    offsetToAxial(row, col) {
        const q = col - Math.floor(row / 2);
        const r = row;
        return { q, r };
    }

    buildBoard() {
        let idCounter = 0;
        for (let row = 0; row < this.shape.length; row++) {
            let colsInRow = this.shape[row];
            for (let col = 0; col < colsInRow; col++) {
                const { q, r } = this.offsetToAxial(row, col);
                const tile = new Tile(idCounter++, row, col, q, r);
                this.tiles.push(tile);
                this.coordMap[`${q},${r}`] = tile;
            }
        }
    }

    neighbors(tile, radius = 1) {
        if (radius <= 0) {
            return [];
        }

        const visited = new Set([tile]);
        const results = [];
        const queue = [{ tile: tile, dist: 0 }];

        while (queue.length > 0) {
            const { tile: currentTile, dist } = queue.shift();

            if (dist >= radius) {
                continue;
            }
            
            for (const dir of Board.axialDirections) {
                const neighborQ = currentTile.q + dir.q;
                const neighborR = currentTile.r + dir.r;
                const neighbor = this.coordMap[`${neighborQ},${neighborR}`];

                if (neighbor && !visited.has(neighbor)) {
                    visited.add(neighbor);
                    results.push(neighbor);
                    queue.push({ tile: neighbor, dist: dist + 1 });
                }
            }
        }
        return results;
    }
}

export { Tile, Board };