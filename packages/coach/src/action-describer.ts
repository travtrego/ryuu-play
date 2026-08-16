import { Action, AttackAction, Player, PlayCardAction, RetreatAction,
  UseAbilityAction, UseTrainerInPlayAction } from '@ptcg/common';

// Turns an internal game Action into a short, human-readable phrase (e.g. for
// display in a coaching UI or as input to an external reasoning layer). Needs
// the pre-action state, since actions like PlayCardAction only reference a
// hand index or bench index rather than a card name.
export function describeAction(player: Player, action: Action): string {
  switch (action.type) {
    case 'PLAY_CARD_ACTION': {
      const playCardAction = action as PlayCardAction;
      const card = player.hand.cards[playCardAction.handIndex];
      return `Play ${card === undefined ? 'a card' : card.name}`;
    }
    case 'ATTACK_ACTION': {
      const attackAction = action as AttackAction;
      return `Attack with ${attackAction.name}`;
    }
    case 'USE_ABILITY_ACTION': {
      const useAbilityAction = action as UseAbilityAction;
      return `Use Ability: ${useAbilityAction.name}`;
    }
    case 'USE_STADIUM_ACTION':
      return 'Use the Stadium in play';
    case 'USE_TRAINER_IN_PLAY_ACTION': {
      const useTrainerInPlayAction = action as UseTrainerInPlayAction;
      return `Use ${useTrainerInPlayAction.cardName} already in play`;
    }
    case 'RETREAT_ACTION': {
      const retreatAction = action as RetreatAction;
      const card = player.bench[retreatAction.benchIndex]?.getPokemonCard();
      return `Retreat to ${card === undefined ? 'the benched Pokémon' : card.name}`;
    }
    case 'PASS_TURN':
      return 'Pass the turn';
    default:
      return action.type;
  }
}
