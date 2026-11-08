import { Pokegear30 } from '../set-black-and-white/pokegear-30';

// Scarlet & Violet 186/198 has the same text as Pokégear 3.0 UNB. Reuse the
// tested effect and register the printing used in today's lists.
export class Pokegear30SVI extends Pokegear30 {
  public set: string = 'SVI';

  public name: string = 'Pokégear 3.0';

  public fullName: string = 'Pokégear 3.0 SVI';

  public text: string =
    'Look at the top 7 cards of your deck. You may reveal a Supporter card you find there and put it into ' +
    'your hand. Shuffle the other cards back into your deck.';
}
