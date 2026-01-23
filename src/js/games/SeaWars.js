export class SeaWars {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  async init() {
    console.log("SeaWars initialized");
  }

  render(ctx, boardElement) {
    if (boardElement) {
      boardElement.innerHTML =
        '<div style="padding: 20px; text-align: center;"> Sea Wars<br><small>Implementation in progress</small></div>';
    }
  }

  getState() {
    return { board: [], currentPlayer: 1 };
  }
}
