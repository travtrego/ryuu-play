import {
  AttackAction,
  CardTag,
  CardType,
  EnergyType,
  ChooseCardsPrompt,
  ChoosePokemonPrompt,
  GameError,
  GameMessage,
  PassTurnAction,
  PlayCardAction,
  PlayerType,
  PowerType,
  ResolvePromptAction,
  Simulator,
  SlotType,
  Stage,
  TrainerType,
  UseAbilityAction,
  UseStadiumAction,
} from '@ptcg/common';

import { MegaGreninjaEx } from '../../../src/standard/set-chaos-rising/mega-greninja-ex';
import { GreninjaEx30C } from '../../../src/standard/set-30th-celebration/greninja-ex';
import { ZinniasTrust } from '../../../src/standard/set-delta-reign/zinnias-trust';
import { SurfingBeach } from '../../../src/standard/set-mega-evolution/surfing-beach';
import { BattleCage } from '../../../src/standard/set-phantasmal-flames/battle-cage';
import { WaterEnergy } from '../../../src/standard/set-diamond-and-pearl/water-energy';
import { FireEnergy } from '../../../src/standard/set-diamond-and-pearl/fire-energy';
import { TestEnergy } from '../../test-cards/test-energy';
import { TestPokemon } from '../../test-cards/test-pokemon';
import { TestUtils } from '../../test-utils';

const active = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
const board = { player: PlayerType.ANY, slot: SlotType.BOARD, index: 0 };

class WaterPokemon extends TestPokemon {
  public cardTypes: CardType[] = [CardType.WATER];
}

describe('Mega Greninja ex deck cards', () => {
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

  it('Should have the printed stats', () => {
    const mega = new MegaGreninjaEx();
    expect<unknown[]>([mega.hp, mega.stage, mega.evolvesFrom, mega.cardTypes, mega.weakness, mega.resistance,
      mega.retreat.length, mega.tags, mega.fullName])
      .toEqual([350, Stage.STAGE_2, 'Frogadier', [CardType.WATER], [{ type: CardType.LIGHTNING }], [], 1,
        [CardTag.POKEMON_EX, CardTag.MEGA_EVOLUTION_EX], 'Mega Greninja ex CRI']);
    expect(mega.powers.map(p => [p.name, p.powerType])).toEqual([['Mortal Shuriken', PowerType.ABILITY]]);
    expect(mega.attacks.map(a => [a.name, a.cost, a.damage]))
      .toEqual([['Ninja Spinner', [CardType.WATER, CardType.WATER], '120+']]);

    const greninja = new GreninjaEx30C();
    expect<unknown[]>([greninja.hp, greninja.stage, greninja.evolvesFrom, greninja.cardTypes, greninja.weakness,
      greninja.retreat.length, greninja.tags, greninja.fullName])
      .toEqual([300, Stage.STAGE_2, 'Frogadier', [CardType.WATER], [{ type: CardType.LIGHTNING }], 1,
        [CardTag.POKEMON_EX], 'Greninja ex 30C']);
    expect(greninja.attacks.map(a => [a.name, a.cost, a.damage]))
      .toEqual([['Stealthy Slash', [CardType.WATER], ''], ['Aqua Edge', [CardType.WATER, CardType.WATER], '160']]);

    expect([new ZinniasTrust().trainerType, new ZinniasTrust().fullName])
      .toEqual([TrainerType.SUPPORTER, 'Zinnia\'s Trust DLR']);
    expect([new SurfingBeach().trainerType, new SurfingBeach().fullName])
      .toEqual([TrainerType.STADIUM, 'Surfing Beach MEG']);
  });

  describe('Mortal Shuriken', () => {
    it('Discards a Basic Water Energy from the hand to put 6 damage counters on 1 opponent\'s Pokémon', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaGreninjaEx()]);
      opponent.bench[0].pokemons.cards = [new TestPokemon()];
      const water = new WaterEnergy();
      const fire = new FireEnergy();
      player.hand.cards = [fire, water];

      sim.dispatch(new UseAbilityAction(1, 'Mortal Shuriken', active));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      expect(prompt instanceof ChoosePokemonPrompt).toBeTrue();
      sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));

      expect(opponent.bench[0].damage).toEqual(60);
      expect(player.hand.cards).toEqual([fire]);
      expect(player.discard.cards).toEqual([water]);

      // Once during your turn.
      player.hand.cards.push(new WaterEnergy());
      expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Mortal Shuriken', active))))
        .toEqual(GameMessage.POWER_ALREADY_USED);
    });

    it('Needs a Basic Water Energy card in the hand and Mega Greninja ex in the Active Spot', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaGreninjaEx()]);
      // A Special Energy that provides W is not a Basic Water Energy card.
      const special = new TestEnergy(CardType.WATER);
      special.energyType = EnergyType.SPECIAL;
      player.hand.cards = [new FireEnergy(), special];
      expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Mortal Shuriken', active))))
        .toEqual(GameMessage.CANNOT_USE_POWER);
    });

    it('Can\'t be used from the Bench', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new TestPokemon()]);
      player.bench[0].pokemons.cards = [new MegaGreninjaEx()];
      player.hand.cards = [new WaterEnergy()];
      expect(code(() => sim.dispatch(new UseAbilityAction(1, 'Mortal Shuriken',
        TestUtils.target(sim, player.bench[0]))))).toEqual(GameMessage.CANNOT_USE_POWER);
      expect(TestUtils.getAll(sim).player.hand.cards.length).toEqual(1);
    });

    it('Cancelling keeps the Energy and the Ability', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaGreninjaEx()]);
      player.hand.cards = [new WaterEnergy()];
      sim.dispatch(new UseAbilityAction(1, 'Mortal Shuriken', active));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, null));
      expect(player.hand.cards.length).toEqual(1);
      sim.dispatch(new UseAbilityAction(1, 'Mortal Shuriken', active));
      expect(TestUtils.lastPrompt(sim, player)).not.toBe(prompt);
    });

    it('Battle Cage stops the counters on a Benched Pokémon', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaGreninjaEx()]);
      opponent.bench[0].pokemons.cards = [new TestPokemon()];
      player.stadium.cards = [new BattleCage()];
      player.hand.cards = [new WaterEnergy()];
      sim.dispatch(new UseAbilityAction(1, 'Mortal Shuriken', active));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
      expect(opponent.bench[0].damage).toEqual(0);
      expect(player.hand.cards.length).toEqual(0);
    });
  });

  describe('Ninja Spinner', () => {
    it('Does 120, or 200 when a Water Energy goes back to the hand', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaGreninjaEx()], [CardType.FIRE, CardType.WATER, CardType.WATER]);
      player.hand.cards = [];
      sim.dispatch(new AttackAction(1, 'Ninja Spinner'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(prompt instanceof ChooseCardsPrompt).toBeTrue();
      expect(prompt.options.blocked).toEqual([0]);
      expect(prompt.options.min).toEqual(0);
      const water = player.active.energies.cards[1];
      sim.dispatch(new ResolvePromptAction(prompt.id, [water]));
      expect(player.hand.cards).toEqual([water]);
      expect(player.active.energies.cards.length).toEqual(2);
      expect(opponent.active.damage).toEqual(200);
    });

    it('Does 120 when no Energy is returned', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaGreninjaEx()], [CardType.WATER, CardType.WATER]);
      sim.dispatch(new AttackAction(1, 'Ninja Spinner'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, []));
      expect(player.active.energies.cards.length).toEqual(2);
      expect(opponent.active.damage).toEqual(120);
    });
  });

  describe('Greninja ex (30C)', () => {
    it('Stealthy Slash does 30 for each damage counter on a Benched Pokémon', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new GreninjaEx30C()], [CardType.WATER]);
      opponent.bench[0].pokemons.cards = [new TestPokemon()];
      opponent.bench[0].damage = 60;
      sim.dispatch(new AttackAction(1, 'Stealthy Slash'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
      expect(opponent.bench[0].damage).toEqual(60 + 180);
      expect(opponent.active.damage).toEqual(0);
    });

    it('Stealthy Slash on the Active Pokémon counts its counters; Aqua Edge does 160', () => {
      const { player, opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new GreninjaEx30C()], [CardType.WATER, CardType.WATER]);
      opponent.active.damage = 20;
      sim.dispatch(new AttackAction(1, 'Stealthy Slash'));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.active]));
      expect(opponent.active.damage).toEqual(20 + 60);
    });

    it('Aqua Edge does 160', () => {
      const { opponent } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new GreninjaEx30C()], [CardType.WATER, CardType.WATER]);
      sim.dispatch(new AttackAction(1, 'Aqua Edge'));
      expect(opponent.active.damage).toEqual(160);
    });
  });

  describe('Zinnia\'s Trust', () => {
    it('Switches and moves an Energy from the old Active to the new one', () => {
      const { player } = TestUtils.getAll(sim);
      const oldActive = new TestPokemon();
      const newActive = new TestPokemon();
      TestUtils.setActive(sim, [oldActive], [CardType.WATER, CardType.FIRE]);
      player.bench[0].pokemons.cards = [newActive];
      const card = new ZinniasTrust();
      player.hand.cards = [card];

      sim.dispatch(new PlayCardAction(1, 0, board));
      const switchPrompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      expect(switchPrompt.options.allowCancel).toBeFalse();
      sim.dispatch(new ResolvePromptAction(switchPrompt.id, [player.bench[0]]));

      expect(player.active.getPokemonCard()).toBe(newActive);
      expect(player.bench[0].getPokemonCard()).toBe(oldActive);
      const energyPrompt = TestUtils.lastPrompt(sim, player) as ChooseCardsPrompt;
      expect(energyPrompt instanceof ChooseCardsPrompt).toBeTrue();
      const fire = player.bench[0].energies.cards[1];
      sim.dispatch(new ResolvePromptAction(energyPrompt.id, [fire]));
      expect(player.active.energies.cards).toEqual([fire]);
      expect(player.bench[0].energies.cards.length).toEqual(1);
      expect(player.supporter.cards).toEqual([card]);
    });

    it('Needs a Benched Pokémon', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new TestPokemon()]);
      player.hand.cards = [new ZinniasTrust()];
      expect(code(() => sim.dispatch(new PlayCardAction(1, 0, board))))
        .toEqual(GameMessage.CANNOT_PLAY_THIS_CARD);
    });

    it('Just switches when the Active Pokémon has no Energy', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new TestPokemon()]);
      player.hand.cards = [new ZinniasTrust()];
      const benched = new TestPokemon();
      player.bench[0].pokemons.cards = [benched];
      sim.dispatch(new PlayCardAction(1, 0, board));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[0]]));
      expect(player.active.getPokemonCard()).toBe(benched);
      expect(player.active.energies.cards.length).toEqual(0);
    });
  });

  describe('Surfing Beach', () => {
    it('Switches an Active Water Pokémon with a Benched Water Pokémon, once a turn', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new MegaGreninjaEx()]);
      const water = new WaterPokemon();
      player.bench[0].pokemons.cards = [new TestPokemon()];
      player.bench[1].pokemons.cards = [water];
      player.stadium.cards = [new SurfingBeach()];

      sim.dispatch(new UseStadiumAction(1));
      const prompt = TestUtils.lastPrompt(sim, player) as ChoosePokemonPrompt;
      expect(prompt instanceof ChoosePokemonPrompt).toBeTrue();
      expect(prompt.options.blocked).toEqual([{ player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 }]);
      sim.dispatch(new ResolvePromptAction(prompt.id, [player.bench[1]]));
      expect(player.active.getPokemonCard()).toBe(water);
      expect(code(() => sim.dispatch(new UseStadiumAction(1)))).toEqual(GameMessage.STADIUM_ALREADY_USED);
    });

    it('Can\'t be used without a Water Pokémon in the Active Spot', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new TestPokemon()]);
      player.bench[0].pokemons.cards = [new WaterPokemon()];
      player.stadium.cards = [new SurfingBeach()];
      expect(code(() => sim.dispatch(new UseStadiumAction(1)))).toEqual(GameMessage.CANNOT_USE_STADIUM);
    });

    it('Can\'t be used without a Water Pokémon on the Bench; cancelling keeps the use', () => {
      const { player } = TestUtils.getAll(sim);
      TestUtils.setActive(sim, [new WaterPokemon()]);
      player.bench[0].pokemons.cards = [new TestPokemon()];
      player.stadium.cards = [new SurfingBeach()];
      expect(code(() => sim.dispatch(new UseStadiumAction(1)))).toEqual(GameMessage.CANNOT_USE_STADIUM);

      // A failed action leaves the state as it was before it.
      const { player: after } = TestUtils.getAll(sim);
      after.bench[1].pokemons.cards = [new WaterPokemon()];
      sim.dispatch(new UseStadiumAction(1));
      const prompt = TestUtils.lastPrompt(sim, after) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, null));
      expect(code(() => sim.dispatch(new UseStadiumAction(1)))).toEqual('ok');
    });

    it('Works for the opponent on their turn too', () => {
      const { opponent } = TestUtils.getAll(sim);
      const { player } = TestUtils.getAll(sim);
      player.stadium.cards = [new SurfingBeach()];
      sim.dispatch(new PassTurnAction(1));
      opponent.active.pokemons.cards = [new WaterPokemon()];
      const water = new WaterPokemon();
      opponent.bench[0].pokemons.cards = [water];
      sim.dispatch(new UseStadiumAction(2));
      const prompt = TestUtils.lastPrompt(sim, opponent) as ChoosePokemonPrompt;
      sim.dispatch(new ResolvePromptAction(prompt.id, [opponent.bench[0]]));
      expect(opponent.active.getPokemonCard()).toBe(water);
    });
  });
});
