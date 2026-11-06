export class Rules {

  public formatName = '';

  public firstTurnDrawCard = true;

  public firstTurnUseSupporter = true;

  /**
   * Whether the player who goes first may attack on their first turn.
   * Older formats allow it; the Scarlet & Violet era Standard rules do not.
   */
  public firstTurnAttack = true;
  
  public noPrizeForFossil = true;

  /**
   * Learn mode: this is a tutorial game (see `createTutorialGame` in the
   * server). Not a rule of play: the engine never reads it. It travels with the
   * state so the web client knows to show the tutorial coach.
   */
  public tutorial = false;

  constructor(init: Partial<Rules> = {}) {
    Object.assign(this, init);
  }

}
