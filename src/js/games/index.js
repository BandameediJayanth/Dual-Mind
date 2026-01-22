/**
 * Games Index - Export all game implementations
 */

export { TicTacToe } from './TicTacToe.js';
export { Checkers } from './Checkers.js';
export { FourInARow } from './FourInARow.js';
export { DotsAndBoxes } from './DotsAndBoxes.js';
export { MemoryMatch } from './MemoryMatch.js';
export { WordChain } from './WordChain.js';
export { Game24 } from './Game24.js';
export { MiniSudoku } from './MiniSudoku.js';
export { Ludo } from './Ludo.js';
export { Reversi } from './Reversi.js';
export { BaseGame } from './BaseGame.js';

/**
 * Game registry for dynamic loading
 */
export const GameRegistry = {
    tictactoe: () => import('./TicTacToe.js').then(m => m.TicTacToe),
    checkers: () => import('./Checkers.js').then(m => m.Checkers),
    fourinarow: () => import('./FourInARow.js').then(m => m.FourInARow),
    dotsandboxes: () => import('./DotsAndBoxes.js').then(m => m.DotsAndBoxes),
    memorymatch: () => import('./MemoryMatch.js').then(m => m.MemoryMatch),
    wordchain: () => import('./WordChain.js').then(m => m.WordChain),
    game24: () => import('./Game24.js').then(m => m.Game24),
    minisudoku: () => import('./MiniSudoku.js').then(m => m.MiniSudoku),
    ludo: () => import('./Ludo.js').then(m => m.Ludo),
    reversi: () => import('./Reversi.js').then(m => m.Reversi)
};

/**
 * Get game class by ID
 */
export async function getGameClass(gameId) {
    const loader = GameRegistry[gameId.toLowerCase()];
    if (!loader) {
        throw new Error(`Unknown game: ${gameId}`);
    }
    return await loader();
}

/**
 * Get all available game metadata
 */
export function getAllGameMetadata() {
    return [
        {
            id: 'tictactoe',
            name: 'Tic Tac Toe',
            category: 'strategy',
            players: { min: 2, max: 2 },
            difficulty: 'easy',
            description: 'Classic 3x3 grid game. Get three in a row to win.',
            icon: '⭕',
            skills: ['pattern-recognition', 'planning']
        },
        {
            id: 'checkers',
            name: 'Checkers',
            category: 'strategy',
            players: { min: 2, max: 2 },
            difficulty: 'medium',
            description: 'Jump over opponent pieces to capture them.',
            icon: '🔴',
            skills: ['planning', 'spatial-reasoning']
        },
        {
            id: 'fourinarow',
            name: 'Connect 4',
            category: 'strategy',
            players: { min: 2, max: 2 },
            difficulty: 'medium',
            description: 'Drop discs and connect four in a row.',
            icon: '🔵',
            skills: ['pattern-recognition', 'planning']
        },
        {
            id: 'dotsandboxes',
            name: 'Dots and Boxes',
            category: 'strategy',
            players: { min: 2, max: 2 },
            difficulty: 'easy',
            description: 'Draw lines to complete boxes and score points.',
            icon: '📦',
            skills: ['planning', 'counting']
        },
        {
            id: 'memorymatch',
            name: 'Memory Match',
            category: 'memory',
            players: { min: 1, max: 2 },
            difficulty: 'easy',
            description: 'Find matching pairs of cards.',
            icon: '🃏',
            skills: ['memory', 'attention']
        },
        {
            id: 'wordchain',
            name: 'Word Chain',
            category: 'word',
            players: { min: 2, max: 2 },
            difficulty: 'medium',
            description: 'Chain words by their first and last letters.',
            icon: '📝',
            skills: ['vocabulary', 'quick-thinking']
        },
        {
            id: 'game24',
            name: 'Game 24',
            category: 'math',
            players: { min: 1, max: 2 },
            difficulty: 'hard',
            description: 'Use math operations to make 24 from four numbers.',
            icon: '🔢',
            skills: ['arithmetic', 'problem-solving']
        },
        {
            id: 'minisudoku',
            name: 'Mini Sudoku',
            category: 'puzzle',
            players: { min: 1, max: 1 },
            difficulty: 'medium',
            description: 'Fill the 4x4 grid with numbers 1-4.',
            icon: '🧩',
            skills: ['logic', 'pattern-recognition']
        },
        {
            id: 'ludo',
            name: 'Ludo',
            category: 'race',
            players: { min: 2, max: 4 },
            difficulty: 'easy',
            description: 'Race your pieces around the board to home.',
            icon: '🎲',
            skills: ['probability', 'decision-making']
        },
        {
            id: 'reversi',
            name: 'Reversi',
            category: 'strategy',
            players: { min: 2, max: 2 },
            difficulty: 'hard',
            description: 'Flip opponent pieces by sandwiching them.',
            icon: '⚫',
            skills: ['planning', 'spatial-reasoning']
        }
    ];
}
