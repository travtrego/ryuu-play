import {
  CardType,
  ChooseCardsPrompt,
  Player,
  PokemonCard,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  State,
  StoreLike,
  TrainerEffect,
} from '@ptcg/common';
import { TeamRocketsProton } from './team-rockets-proton';

class TeamRocketBasic extends PokemonCard {
  public cardTypes: CardType[] = [CardType.PSYCHIC];
  public set: string = 'TEST';
  public name: string;
  public fullName: string;
  public hp: number = 60;

  constructor(suffix: string) {
    super();
    this.name = `Team Rocket's Test ${suffix}`;
    this.fullName = `${this.name} TEST`;
  }
}

class OtherBasic extends PokemonCard {
  public cardTypes: CardType[] = [CardType.PSYCHIC];
  public set: string = 'TEST';
  public name: string = 'Other Basic';
  public fullName: string = 'Other Basic TEST';
  public hp: number = 60;
}

describe("Team Rocket's Proton", () => {
  it('opts into the first-turn Supporter exception', () => {
    expect(new TeamRocketsProton().canUseOnFirstTurn).toBe(true);
  });

  it("searches for up to 3 Basic Team Rocket's Pokemon and moves them to hand", () => {
    const proton = new TeamRocketsProton();
    const state = new State();
    const player = new Player();
    const opponent = new Player();
    player.id = 1;
    opponent.id = 2;
    state.players = [player, opponent];
    state.activePlayer = 0;

    const rocket1 = new TeamRocketBasic('A');
    const rocket2 = new TeamRocketBasic('B');
    const rocket3 = new TeamRocketBasic('C');
    const other = new OtherBasic();
    player.deck.cards = [rocket1, rocket2, rocket3, other];

    const prompts: any[] = [];
    const callbacks: Array<(result: any) => void> = [];
    const store = {
      prompt: (currentState: State, prompt: any, then: (result: any) => void) => {
        prompts.push(prompt);
        callbacks.push(then);
        return currentState;
      },
    } as unknown as StoreLike;

    proton.reduceEffect(store, state, new TrainerEffect(player, proton));

    expect(prompts[0] instanceof ChooseCardsPrompt).toBe(true);
    expect(prompts[0].cards.cards).toEqual([rocket1, rocket2, rocket3]);
    expect(prompts[0].options.max).toBe(3);

    callbacks[0]([rocket1, rocket2, rocket3]);
    expect(prompts[1] instanceof ShowCardsPrompt).toBe(true);

    callbacks[1](undefined);
    expect(prompts[2] instanceof ShuffleDeckPrompt).toBe(true);
    expect(player.hand.cards).toEqual([rocket1, rocket2, rocket3]);
    expect(player.deck.cards).toEqual([other]);
  });
});
