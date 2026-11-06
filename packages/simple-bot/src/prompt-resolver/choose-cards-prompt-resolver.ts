import { Player, State, Action, ResolvePromptAction, Prompt, Card, CardList, FilterUtils,
  GameMessage } from '@ptcg/common';
import { PromptResolver } from './prompt-resolver';
import { ChooseCardsPrompt } from '@ptcg/common';
import { joinList } from '../explain/explain-utils';


export class ChooseCardsPromptResolver extends PromptResolver {

  public resolvePrompt(state: State, player: Player, prompt: Prompt<any>): Action | undefined {
    if (prompt instanceof ChooseCardsPrompt) {
      let result: Card[] | null = this.buildCardsToChoose(state, prompt);
      result = this.removeInvalidCards(prompt, result);
      if (result.length > prompt.options.max) {
        result.length = prompt.options.max;
      }
      if (result.length < prompt.options.min) {
        result = null;
      }
      return new ResolvePromptAction(prompt.id, result);
    }
  }

  /**
   * Learn mode. Only discards from the bot's own hand are explained: the
   * discarded cards become public, and for hand cards the ranking in
   * buildCardsToChoose() is "how much the hand evaluation loses without this
   * card", smallest loss first. Other choices (deck searches, the starting
   * Pokémon) would reveal hidden cards, so they get no reason.
   */
  public explain(state: State, player: Player, prompt: Prompt<any>, action: Action): string {
    if (!(prompt instanceof ChooseCardsPrompt) || !(action instanceof ResolvePromptAction)) {
      return '';
    }
    if (prompt.message !== GameMessage.CHOOSE_CARD_TO_DISCARD || prompt.cards !== player.hand) {
      return '';
    }
    const chosen: Card[] | null = action.result;
    if (chosen === null || chosen.length === 0) {
      return '';
    }
    const names = joinList(chosen.map(card => card.name));
    const it = chosen.length === 1 ? 'it was the least useful card' : 'they were the least useful cards';
    return `Discarded ${names} from its hand: ${it} to keep by the bot's hand evaluation, `
      + 'which values Energy, Supporters and other Trainers, an evolution for a Pokémon in play, '
      + 'and a Basic Pokémon when its Bench is empty.';
  }

  private removeInvalidCards(prompt: ChooseCardsPrompt, cards: Card[]): Card[] {
    const result: Card[] = [];

    // temporary remove min restriction for this prompt
    const minCopy = prompt.options.min;
    prompt.options.min = 0;

    // Add card by card to the results and check if it is still valid
    for (const card of cards) {
      if (prompt.validate([...result, card])) {
        result.push(card);
      }
    }

    prompt.options.min = minCopy;
    return result;
  }

  private buildCardsToChoose(state: State, prompt: ChooseCardsPrompt): Card[] {
    const cardList = new CardList();

    cardList.cards = prompt.cards.cards.filter((card, index) => {
      return !prompt.options.blocked.includes(index);
    });

    const cards = FilterUtils.filter(cardList.cards, prompt.filter).map(card => {
      const score = this.stateScore.getCardScore(state, prompt.playerId, card);
      return { card, score };
    });

    cards.sort((a, b) => b.score - a.score);
    return cards.map(c => c.card);
  }

}
