import { AttachEnergyPrompt, CardList, ChooseCardsPrompt, ChoosePokemonPrompt, ConfirmPrompt,
  EnergyCard, GameMessage, PlayerType, PokemonCard, PokemonSlot, SelectPrompt, ShowCardsPrompt,
  ShuffleDeckPrompt, SlotType, SuperType } from '@ptcg/common';
import { describeCardTarget, describePrompt, describePromptResult,
  humanizeGameMessage } from './prompt-describer';

function testPokemon(name: string): PokemonCard {
  class TestPokemon extends PokemonCard {
    name = name;
    fullName = name;
    set = 'TST';
    hp = 100;
  }
  return new TestPokemon();
}

function testEnergy(name: string): EnergyCard {
  class TestEnergy extends EnergyCard {
    name = name;
    fullName = name;
    set = 'TST';
  }
  return new TestEnergy();
}

describe('humanizeGameMessage', () => {

  it('turns a SCREAMING_SNAKE game message into a readable sentence', () => {
    expect(humanizeGameMessage('CHOOSE_NEW_ACTIVE_POKEMON')).toBe('Choose new active pokemon');
  });

  it('handles an empty message without crashing', () => {
    expect(humanizeGameMessage('')).toBe('');
  });

});

describe('describeCardTarget', () => {

  it('names the Active Spot', () => {
    expect(describeCardTarget({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 }))
      .toBe('the Active Spot');
  });

  it('numbers bench slots from one, not zero', () => {
    expect(describeCardTarget({ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 2 }))
      .toBe('bench slot 3');
  });

});

describe('describePrompt', () => {

  it('states the range for a choose-cards prompt', () => {
    const cards = new CardList();
    cards.cards = [ testPokemon('Tarountula'), testPokemon('Spidops') ];
    const prompt = new ChooseCardsPrompt(1, GameMessage.CHOOSE_CARD_TO_HAND, cards,
      { superType: SuperType.POKEMON }, { min: 1, max: 2 });

    expect(describePrompt(prompt)).toBe('Choose card to hand (choose 1-2)');
  });

  it('collapses the range when exactly one choice is required', () => {
    const prompt = new ChoosePokemonPrompt(1, GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,
      PlayerType.BOTTOM_PLAYER, [ SlotType.BENCH ], { min: 1, max: 1 });

    expect(describePrompt(prompt)).toBe('Choose new active pokemon (choose 1)');
  });

  it('lists the options for a select prompt', () => {
    const prompt = new SelectPrompt(1, GameMessage.CHOOSE_OPTION, [ 'Heads', 'Tails' ]);

    expect(describePrompt(prompt)).toContain('Heads / Tails');
  });

});

describe('describePromptResult', () => {

  it('describes declining', () => {
    const prompt = new ConfirmPrompt(1, GameMessage.WANT_TO_USE_ABILITY);

    expect(describePromptResult(prompt, null)).toBe('Decline');
  });

  it('describes a confirm answer as Yes or No', () => {
    const prompt = new ConfirmPrompt(1, GameMessage.WANT_TO_USE_ABILITY);

    expect(describePromptResult(prompt, true)).toBe('Yes');
    expect(describePromptResult(prompt, false)).toBe('No');
  });

  it('resolves a select answer back to its label rather than its index', () => {
    const prompt = new SelectPrompt(1, GameMessage.CHOOSE_OPTION, [ 'Heads', 'Tails' ]);

    expect(describePromptResult(prompt, 1)).toBe('Tails');
  });

  it('names the chosen cards', () => {
    const cards = new CardList();
    cards.cards = [ testPokemon('Tarountula'), testPokemon('Spidops') ];
    const prompt = new ChooseCardsPrompt(1, GameMessage.CHOOSE_CARD_TO_HAND, cards,
      { superType: SuperType.POKEMON });

    expect(describePromptResult(prompt, cards.cards)).toBe('Tarountula, Spidops');
  });

  it('describes choosing nothing', () => {
    const cards = new CardList();
    const prompt = new ChooseCardsPrompt(1, GameMessage.CHOOSE_CARD_TO_HAND, cards,
      { superType: SuperType.POKEMON });

    expect(describePromptResult(prompt, [])).toBe('Choose nothing');
  });

  it('names the chosen Pokémon rather than printing slot objects', () => {
    const slot = new PokemonSlot();
    slot.pokemons.cards = [ testPokemon('Spidops') ];
    const prompt = new ChoosePokemonPrompt(1, GameMessage.CHOOSE_NEW_ACTIVE_POKEMON,
      PlayerType.BOTTOM_PLAYER, [ SlotType.BENCH ]);

    expect(describePromptResult(prompt, [ slot ])).toBe('Spidops');
  });

  // Flagged by GPT: the Team Rocket Transceiver/Petrel/Factory line routes
  // through these flows. Their results are a deck permutation and a bare
  // acknowledgement, which would otherwise render as raw data at the user.
  it('describes a shuffle without printing the deck permutation', () => {
    const prompt = new ShuffleDeckPrompt(1);
    const wholeDeck = Array.from({ length: 60 }, (unused, index) => index);

    expect(describePromptResult(prompt, wholeDeck)).toBe('Shuffle your deck');
  });

  it('describes a show-cards prompt as an acknowledgement, not a yes', () => {
    const prompt = new ShowCardsPrompt(1, GameMessage.CARDS_SHOWED_BY_THE_OPPONENT,
      [ testPokemon('Tarountula') ]);

    expect(describePromptResult(prompt, true)).toBe('Acknowledge');
  });

  it('describes energy attachments as card to destination', () => {
    const cards = new CardList();
    const energy = testEnergy('Psychic Energy');
    cards.cards = [ energy ];
    const prompt = new AttachEnergyPrompt(1, GameMessage.ATTACH_ENERGY_TO_ACTIVE, cards,
      PlayerType.BOTTOM_PLAYER, [ SlotType.ACTIVE ], { superType: SuperType.ENERGY });

    const result = [ { card: energy, to: { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 } } ];

    expect(describePromptResult(prompt, result)).toBe('Psychic Energy to the Active Spot');
  });

});
