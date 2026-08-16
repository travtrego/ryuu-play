import { UltraBall } from '../set-black-and-white/ultra-ball';

// Mega Evolution 131/132 is a mechanical reprint of Ultra Ball. Reuse the
// tested effect implementation while registering the physical printing's
// fullName so real decklists can resolve it through CardManager.
export class UltraBallMEG extends UltraBall {
  public set: string = 'MEG';

  public name: string = 'Ultra Ball';

  public fullName: string = 'Ultra Ball MEG';

  public text: string =
    'You can use this card only if you discard 2 other cards from your hand. ' +
    'Search your deck for a Pokémon, reveal it, and put it into your hand. Then, shuffle your deck.';
}
