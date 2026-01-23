export class Ludo {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    async init() {
        console.log('Ludo initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) {
            boardElement.innerHTML = '<div style=\"padding: 20px; text-align: center;\"> Ludo<br><small>Implementation in progress</small></div>';
        }
    }

    getState() {
        return { board: [], currentPlayer: 1 };
    }
}
