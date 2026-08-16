import { EnergySwitch } from '../set-black-and-white-3/energy-switch';

// Scarlet & Violet 173/198 has the same effect as the established Energy
// Switch implementation. Register the exact printing used by curated lists.
export class EnergySwitchSVI extends EnergySwitch {
  public set: string = 'SVI';

  public name: string = 'Energy Switch';

  public fullName: string = 'Energy Switch SVI';

  public text: string = 'Move a Basic Energy from 1 of your Pokémon to another of your Pokémon.';
}
