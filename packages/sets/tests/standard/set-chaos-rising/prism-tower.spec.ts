import {
  Player,
  State,
  StoreLike,
  TrainerCard,
  TrainerType,
  UseStadiumEffect,
  ChooseCardsPrompt,
} from '@ptcg/common';
import { PrismTower } from '../../../src/standard/set-chaos-rising/prism-tower';

class TestItem extends TrainerCard {
  public trainerType: TrainerType = TrainerType.ITEM;
  public set: string = 'TEST';
  public name: string;
  public fullName: string;

  constructor(name: string) {
    super();
    this.name = name;
    this.fullName = `${name} TEST`;
  }
}

describe('Prism Tower', () => {
  it('discards exactly 2 cards to draw the top card of the deck', () => {
    const prismTower = new PrismTower();
    const state = new State();
    const player = new Player();
    player.id = 1;
    state.players = [player];
    state.activePlayer = 0;
    player.stadium.cards = [prismTower];

    const discardA = new TestItem('Discard A');
    const discardB = new TestItem('Discard B');
    const keep = new TestItem('Keep');
    const draw = new TestItem('Draw');
    player.hand.cards = [discardA, discardB, keep];
    player.deck.cards = [draw];

    let prompt: any;
    let callback: ((result: any) => void) | undefined;
    const store = {
      prompt: (currentState: State, nextPrompt: any, then: (result: any) => void) => {
        prompt = nextPrompt;
        callback = then;
        return currentState;
      },
    } as unknown as StoreLike;

    prismTower.reduceEffect(store, state, new UseStadiumEffect(player, prismTower));

    expect(prompt instanceof ChooseCardsPrompt).toBe(true);
    expect(prompt.options.min).toBe(2);
    expect(prompt.options.max).toBe(2);

    callback!([discardA, discardB]);

    expect(player.discard.cards).toEqual([discardA, discardB]);
    expect(player.hand.cards).toEqual([keep, draw]);
    expect(player.deck.cards.length).toBe(0);
  });
});
