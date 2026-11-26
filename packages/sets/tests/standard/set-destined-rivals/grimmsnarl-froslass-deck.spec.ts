import {
  AttachEnergyPrompt,
  AttackAction,
  CardTag,
  CardType,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  ConfirmPrompt,
  GameError,
  GameMessage,
  PassTurnAction,
  PlayCardAction,
  PlayerType,
  PowerType,
  ResolvePromptAction,
  ShowCardsPrompt,
  ShuffleDeckPrompt,
  Simulator,
  SlotType,
  Stage,
  TrainerType,
  UseStadiumAction,
} from '@ptcg/common';

import { MarniesImpidimp } from '../../../src/standard/set-destined-rivals/marnies-impidimp';
import { MarniesMorgrem } from '../../../src/standard/set-destined-rivals/marnies-morgrem';
import { MarniesGrimmsnarlEx } from '../../../src/standard/set-destined-rivals/marnies-grimmsnarl-ex';
import { SpikemuthGym } from '../../../src/standard/set-destined-rivals/spikemuth-gym';
import { isMarniesPokemon } from '../../../src/standard/set-destined-rivals/marnie-utils';
import { ShayminDRI } from '../../../src/standard/set-destined-rivals/shaymin';
import { TeamRocketsWatchtower } from '../../../src/standard/set-destined-rivals/team-rockets-watchtower';
import { FroslassTWM } from '../../../src/standard/set-twilight-masquerade/froslass';
import { Munkidori } from '../../../src/standard/set-twilight-masquerade/munkidori';
import { SnoruntASC } from '../../../src/standard/set-ascended-heroes/snorunt';
import { Sinistcha } from '../../../src/standard/set-pitch-black/sinistcha';
import { DarknessEnergy } from '../../../src/standard/set-diamond-and-pearl/darkness-energy';
import { FireEnergy } from '../../../src/standard/set-diamond-and-pearl/fire-energy';
import { TestCard } from '../../test-cards/test-card';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

/** A C Pokémon with an Ability (as Dudunsparce), for Team Rocket's Watchtower. */
class ColorlessWithAbility extends TestPokemon {
  public cardTypes: CardType[] = [CardType.COLORLESS];
  public powers = [{ name: 'Test Ability', powerType: PowerType.ABILITY, text: '' }];
}

/** A Pokémon that is not Froslass but has an Ability. */
class WaterWithAbility extends TestPokemon {
  public cardTypes: CardType[] = [CardType.WATER];
  public powers = [{ name: 'Test Ability', powerType: PowerType.ABILITY, text: '' }];
}

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const bench0 = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
const bench1 = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 };

describe('Grimmsnarl Froslass deck cards', () => {
  let sim: Simulator;

  beforeEach(() => {
    sim = TestUtils.createTestSimulator();
    sim.store.state.turn = 5;
  });

  function code(action: () => void): string {
    try {
      action();
    } catch (e) {
      return (e as GameError).message;
    }
    return 'ok';
  }

  function shuffle(): void {
    const { player, opponent } = TestUtils.getAll(sim);
    const show = TestUtils.lastPrompt(sim, opponent);
    if (show instanceof ShowCardsPrompt && show.result === undefined) {
      sim.dispatch(new ResolvePromptAction(show.id, true));
    }
    const prompt = TestUtils.lastPrompt(sim, player);
    if (prompt instanceof ShuffleDeckPrompt && prompt.result === undefined) {
      sim.dispatch(new ResolvePromptAction(prompt.id, [...Array(player.deck.cards.length).keys()]));
    }
  }

  it('Should have the printed stats', () => {
    const grass = [{ type: CardType.GRASS }];
    const impidimp = new MarniesImpidimp();
    expect([impidimp.hp, impidimp.stage, impidimp.cardTypes, impidimp.weakness, impidimp.retreat.length])
      .toEqual([70, Stage.BASIC, [CardType.DARK], grass, 1]);
    expect(impidimp.attacks.map(a => [a.name, a.cost, a.damage])).toEqual([
      ['Filch', [CardType.COLORLESS], ''],
      ['Corkscrew Punch', [CardType.DARK], '10'],
    ]);

    const morgrem = new MarniesMorgrem();
    expect([morgrem.hp, morgrem.stage, morgrem.evolvesFrom, morgrem.cardTypes, morgrem.weakness,
      morgrem.retreat.length]).toEqual([100, Stage.STAGE_1, 'Marnie\'s Impidimp', [CardType.DARK], grass, 1]);
    expect(morgrem.attacks.map(a => [a.name, a.cost, a.damage]))
      .toEqual([['Corkscrew Punch', [CardType.DARK, CardType.DARK], '60']]);

    const grimmsnarl = new MarniesGrimmsnarlEx();
    expect([grimmsnarl.hp, grimmsnarl.stage, grimmsnarl.evolvesFrom, grimmsnarl.cardTypes, grimmsnarl.weakness,
      grimmsnarl.retreat.length, grimmsnarl.tags])
      .toEqual([320, Stage.STAGE_2, 'Marnie\'s Morgrem', [CardType.DARK], grass, 2, [CardTag.POKEMON_EX]]);
    expect(grimmsnarl.powers.map(p => [p.name, p.powerType])).toEqual([['Punk Up', PowerType.ABILITY]]);
    expect(grimmsnarl.attacks.map(a => [a.name, a.cost, a.damage]))
      .toEqual([['Shadow Bullet', [CardType.DARK, CardType.DARK], '180']]);

    const froslass = new FroslassTWM();
    expect([froslass.hp, froslass.stage, froslass.evolvesFrom, froslass.cardTypes,
      froslass.weakness, froslass.retreat.length])
      .toEqual([90, Stage.STAGE_1, 'Snorunt', [CardType.WATER], [{ type: CardType.METAL }], 1]);
    expect(froslass.powers.map(p => [p.name, p.powerType])).toEqual([['Freezing Shroud', PowerType.ABILITY]]);
    expect(froslass.attacks.map(a => [a.name, a.cost, a.damage]))
      .toEqual([['Frost Smash', [CardType.WATER, CardType.COLORLESS], '60']]);

    expect(new SpikemuthGym().trainerType).toEqual(TrainerType.STADIUM);
    expect([impidimp, morgrem, grimmsnarl].every(c => isMarniesPokemon(c))).toBeTrue();
    expect(isMarniesPokemon(new SnoruntASC())).toBeFalse();
    expect(isMarniesPokemon(new SpikemuthGym())).toBeFalse();
  });

  it('Filch draws a card and Corkscrew Punch does 10', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    player.hand.cards = [];
    TestUtils.setActive(sim, [new MarniesImpidimp()], [CardType.COLORLESS]);
    sim.dispatch(new AttackAction(1, 'Filch'));
    expect(player.hand.cards.length).toEqual(1);
    expect(opponent.active.damage).toEqual(0);
  });

  it('Punk Up attaches up to 5 Basic D Energy from the deck to Marnie\'s Pokémon only', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new MarniesImpidimp(), new MarniesMorgrem()];
    player.active.pokemonPlayedTurn = 1;
    player.bench[0].pokemons.cards = [new MarniesImpidimp()];
    player.bench[1].pokemons.cards = [new TestPokemon()];
    const grimmsnarl = new MarniesGrimmsnarlEx();
    player.hand.cards = [grimmsnarl];
    const dark = [0, 1, 2, 3, 4, 5].map(() => new DarknessEnergy());
    const fire = new FireEnergy();
    player.deck.cards = [new TestCard(), fire, ...dark];

    sim.dispatch(new PlayCardAction(1, 0, active));
    const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
    expect(confirm instanceof ConfirmPrompt).toBeTrue();
    sim.dispatch(new ResolvePromptAction(confirm.id, true));

    const prompt = TestUtils.lastPrompt(sim, player) as AttachEnergyPrompt;
    expect(prompt instanceof AttachEnergyPrompt).toBeTrue();
    expect(prompt.cardList).toBe(player.deck);
    expect(prompt.options.max).toEqual(5);
    expect(prompt.options.blockedTo).toEqual([bench1]);
    expect(prompt.filter).toEqual(jasmine.objectContaining({ provides: [CardType.DARK] }));
    // The Grimmsnarl ex has already evolved: it is a target too.
    expect(player.active.getPokemonCard()).toBe(grimmsnarl);

    sim.dispatch(new ResolvePromptAction(prompt.id, [
      { to: active, card: dark[0] },
      { to: active, card: dark[1] },
      { to: active, card: dark[2] },
      { to: bench0, card: dark[3] },
      { to: bench0, card: dark[4] },
    ]));
    shuffle();
    expect(player.active.energies.cards).toEqual([dark[0], dark[1], dark[2]]);
    expect(player.bench[0].energies.cards).toEqual([dark[3], dark[4]]);
    expect(player.bench[1].energies.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(3);
    expect(player.deck.cards).toContain(fire);
  });

  it('Punk Up may be declined', () => {
    const { player } = TestUtils.getAll(sim);
    player.active.pokemons.cards = [new MarniesImpidimp(), new MarniesMorgrem()];
    player.active.pokemonPlayedTurn = 1;
    player.hand.cards = [new MarniesGrimmsnarlEx()];
    player.deck.cards = [new DarknessEnergy()];
    sim.dispatch(new PlayCardAction(1, 0, active));
    const confirm = TestUtils.lastPrompt(sim, player) as ConfirmPrompt;
    sim.dispatch(new ResolvePromptAction(confirm.id, false));
    expect(player.active.getPokemonCard() instanceof MarniesGrimmsnarlEx).toBeTrue();
    expect(player.active.energies.cards).toEqual([]);
    expect(player.deck.cards.length).toEqual(1);
  });

  it('Shadow Bullet does 180 to the Active and 30 to a Benched Pokémon without Weakness', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    TestUtils.setActive(sim, [new MarniesGrimmsnarlEx()], [CardType.DARK, CardType.DARK]);
    opponent.active.pokemons.cards = [new TestPokemon()];
    opponent.active.pokemons.cards[0].hp = 400;
    const benched = new TestPokemon();
    benched.weakness = [{ type: CardType.DARK }];
    opponent.bench[2].pokemons.cards = [benched];
    sim.dispatch(new AttackAction(1, 'Shadow Bullet'));
    const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
    expect(prompt instanceof ChoosePokemonPrompt).toBeTrue();
    expect(prompt.slots).toEqual([SlotType.BENCH]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[2]]));
    expect(opponent.active.damage).toEqual(180);
    expect(opponent.bench[2].damage).toEqual(30);
  });

  it('Spikemuth Gym finds a Marnie\'s Pokémon once a turn, revealed', () => {
    const { player, opponent } = TestUtils.getAll(sim);
    const impidimp = new MarniesImpidimp();
    player.deck.cards = [new TestCard(), impidimp, new SnoruntASC()];
    player.hand.cards = [];
    player.stadium.cards = [new SpikemuthGym()];

    sim.dispatch(new UseStadiumAction(1));
    const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
    expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
    expect(prompt.options.blocked).toEqual([0, 2]);
    sim.dispatch(new ResolvePromptAction(prompt.id, [impidimp]));
    expect(TestUtils.lastPrompt(sim, opponent) instanceof ShowCardsPrompt).toBeTrue();
    shuffle();
    expect(player.hand.cards).toEqual([impidimp]);
    expect(player.deck.cards.length).toEqual(2);
    expect(code(() => sim.dispatch(new UseStadiumAction(1)))).toEqual(GameMessage.STADIUM_ALREADY_USED);
  });

  it('Spikemuth Gym still shuffles when the deck has no Marnie\'s Pokémon, and needs a deck', () => {
    const { player } = TestUtils.getAll(sim);
    player.deck.cards = [new TestCard()];
    player.stadium.cards = [new SpikemuthGym()];
    sim.dispatch(new UseStadiumAction(1));
    expect(TestUtils.lastPrompt(sim, player) instanceof ChooseCardsPrompt).toBeFalse();
    expect(player.deck.cards.length).toEqual(1);

    sim.store.state.turn = 7;
    player.deck.cards = [];
    expect(code(() => sim.dispatch(new UseStadiumAction(1)))).toEqual(GameMessage.CANNOT_USE_STADIUM);
  });

  describe('Froslass Freezing Shroud', () => {
    it('puts 1 damage counter on each Pokémon with an Ability during Pokémon Checkup, except Froslass', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.active.pokemons.cards = [new SnoruntASC(), new FroslassTWM()];
      player.bench[0].pokemons.cards = [new Munkidori()];
      player.bench[1].pokemons.cards = [new TestPokemon()];
      player.bench[2].pokemons.cards = [new SnoruntASC(), new FroslassTWM()];
      opponent.bench[0].pokemons.cards = [new ShayminDRI()];
      opponent.bench[1].pokemons.cards = [new WaterWithAbility()];

      sim.dispatch(new PassTurnAction(1));
      // Two Froslass: each puts its own counter.
      expect(player.bench[0].damage).toEqual(20);
      expect(opponent.bench[0].damage).toEqual(20);
      expect(opponent.bench[1].damage).toEqual(20);
      expect(player.active.damage).toEqual(0);
      expect(player.bench[2].damage).toEqual(0);
      expect(player.bench[1].damage).toEqual(0);
      expect(opponent.active.damage).toEqual(0);
    });

    it('does not work from a Snorunt that has not evolved or from the hand', () => {
      const { player } = TestUtils.getAll(sim);
      player.hand.cards = [new FroslassTWM()];
      player.bench[0].pokemons.cards = [new Munkidori()];
      sim.dispatch(new PassTurnAction(1));
      expect(player.bench[0].damage).toEqual(0);
    });

    it('skips Pokémon protected by Hide \'n\' Sneak and C Pokémon under Team Rocket\'s Watchtower', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      player.active.pokemons.cards = [new SnoruntASC(), new FroslassTWM()];
      opponent.bench[0].pokemons.cards = [new Sinistcha()];
      opponent.bench[1].pokemons.cards = [new ColorlessWithAbility()];
      player.bench[0].pokemons.cards = [new ColorlessWithAbility()];
      player.bench[1].pokemons.cards = [new Munkidori()];
      sim.store.state.players[0].stadium.cards = [new TeamRocketsWatchtower()];

      sim.dispatch(new PassTurnAction(1));
      expect(opponent.bench[0].damage).toEqual(0);
      expect(opponent.bench[1].damage).toEqual(0);
      expect(player.bench[0].damage).toEqual(0);
      expect(player.bench[1].damage).toEqual(10);
    });

    it('Frost Smash does 60', () => {
      const { opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new SnoruntASC(), new FroslassTWM()], [CardType.WATER, CardType.COLORLESS]);
      sim.dispatch(new AttackAction(1, 'Frost Smash'));
      expect(opponent.active.damage).toEqual(60);
    });
  });
});
