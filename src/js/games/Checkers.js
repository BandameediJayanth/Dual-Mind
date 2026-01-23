export class Checkers {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    async init() {
        console.log('Checkers initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) {
            boardElement.innerHTML = '<div style=\"padding: 20px; text-align: center;\"> Checkers<br><small>Implementation in progress</small></div>';
        }
    }

    getState() {
        return { board: [], currentPlayer: 1 };
    }
}
