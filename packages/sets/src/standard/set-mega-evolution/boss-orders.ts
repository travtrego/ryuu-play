import { BossOrdersGhetsis } from '../set-paldea-evolved/boss-orders-ghetsis';

// Mega Evolution 114: same effect as Boss's Orders (Ghetsis) PAL.
export class BossOrdersMEG extends BossOrdersGhetsis {
  public set: string = 'MEG';

  public name: string = 'Boss\'s Orders';

  public fullName: string = 'Boss\'s Orders MEG';

  public text: string = 'Switch 1 of your opponent\'s Benched Pokémon with their Active Pokémon.';
}
