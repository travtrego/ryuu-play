import { EnergySwitch } from '../set-black-and-white-3/energy-switch';

// Mega Evolution 115/132 is a mechanical reprint of Energy Switch. Keep one
// effect implementation and register this printing's exact fullName.
export class EnergySwitchMEG extends EnergySwitch {
  public set: string = 'MEG';

  public fullName: string = 'Energy Switch MEG';

  public text: string = 'Move a Basic Energy from 1 of your Pokémon to another of your Pokémon.';
}
