/** Local cache of game data. The SQLite storage follows in #8. */
export class CacheService {
  private open = false;

  isOpen(): boolean {
    return this.open;
  }

  start(): void {
    this.open = true;
  }

  stop(): void {
    this.open = false;
  }
}
