export class SnakeAndLadders {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    async init() {
        console.log('SnakeAndLadders initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) {
            boardElement.innerHTML = '<div style="padding: 20px; text-align: center;"> Snake & Ladders<br><small>Implementation in progress</small></div>';
        }
    }

    getState() {
        return { board: [], currentPlayer: 1 };
    }
}