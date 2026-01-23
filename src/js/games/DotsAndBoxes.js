export class DotsAndBoxes {
    constructor(eventBus) {
        this.eventBus = eventBus;
    }

    async init() {
        console.log('Dots and Boxes initialized');
    }

    render(ctx, boardElement) {
        if (boardElement) {
            boardElement.innerHTML = '<div style=\"padding: 20px; text-align: center;\"> Dots & Boxes<br><small>Implementation in progress</small></div>';
        }
    }

    getState() {
        return { board: [], currentPlayer: 1 };
    }
}
