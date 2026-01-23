export class WordChain {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    async init() {
        console.log('Word Chain initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) {
            boardElement.innerHTML = '<div style=\"padding: 20px; text-align: center;\"> Word Chain<br><small>Implementation in progress</small></div>';
        }
    }

    getState() {
        return { words: [], currentPlayer: 1 };
    }
}
