import { AttachEnergyPrompt, AttachEnergyPromptType, CardAssign } from './attach-energy-prompt';
import { CardList } from '../state/card-list';
import { CardTarget, PlayerType, SlotType } from '../actions/play-card-action';
import { GameMessage } from '../../game-message';
import { SuperType } from '../card/card-types';
import { TestEnergy, TestBasic } from '../reducers/reducer-test-utils';

describe('AttachEnergyPrompt', () => {
  const active: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.ACTIVE, index: 0 };
  const bench0: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 0 };
  const bench1: CardTarget = { player: PlayerType.BOTTOM_PLAYER, slot: SlotType.BENCH, index: 1 };

  let cardList: CardList;
  let e1: TestEnergy;
  let e2: TestEnergy;
  let pokemon: TestBasic;

  function create(options = {}): AttachEnergyPrompt {
    return new AttachEnergyPrompt(1, GameMessage.ATTACH_ENERGY_CARDS, cardList,
      PlayerType.BOTTOM_PLAYER, [SlotType.ACTIVE, SlotType.BENCH], { superType: SuperType.ENERGY }, options);
  }

  beforeEach(() => {
    e1 = new TestEnergy();
    e2 = new TestEnergy();
    pokemon = new TestBasic();
    cardList = new CardList();
    cardList.cards = [e1, pokemon, e2];
  });

  it('Should use default options', () => {
    const prompt = create();
    expect(prompt.type).toBe(AttachEnergyPromptType);
    expect(prompt.options).toEqual({
      allowCancel: true, min: 0, max: 3, blocked: [], blockedTo: [], sameTarget: false, differentTargets: false
    });
  });

  it('Should accept cancel only when allowed', () => {
    expect(create().validate(null)).toBeTrue();
    expect(create({ allowCancel: false }).validate(null)).toBeFalse();
  });

  it('Should enforce min and max', () => {
    const one: CardAssign[] = [{ to: active, card: e1 }];
    expect(create({ min: 2 }).validate(one)).toBeFalse();
    expect(create({ max: 0 }).validate(one)).toBeFalse();
    expect(create({ min: 1, max: 1 }).validate(one)).toBeTrue();
  });

  it('Should reject cards that do not match the filter or are blocked', () => {
    expect(create().validate([{ to: active, card: pokemon }])).toBeFalse();
    expect(create({ blocked: [2] }).validate([{ to: active, card: e2 }])).toBeFalse();
    expect(create({ blocked: [2] }).validate([{ to: active, card: e1 }])).toBeTrue();
  });

  it('Should reject attaching to a blocked target', () => {
    const prompt = create({ blockedTo: [bench0] });
    expect(prompt.validate([{ to: bench0, card: e1 }])).toBeFalse();
    expect(prompt.validate([{ to: active, card: e1 }, { to: bench0, card: e2 }])).toBeFalse();
    expect(prompt.validate([{ to: bench1, card: e1 }, { to: active, card: e2 }])).toBeTrue();
  });

  it('Should enforce sameTarget and differentTargets', () => {
    const same: CardAssign[] = [{ to: active, card: e1 }, { to: active, card: e2 }];
    const different: CardAssign[] = [{ to: active, card: e1 }, { to: bench0, card: e2 }];
    expect(create({ sameTarget: true }).validate(same)).toBeTrue();
    expect(create({ sameTarget: true }).validate(different)).toBeFalse();
    expect(create({ differentTargets: true }).validate(different)).toBeTrue();
    expect(create({ differentTargets: true }).validate(same)).toBeFalse();
  });
});
