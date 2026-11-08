import { Switch } from '../set-black-and-white/switch';

// Mega Evolution 130/132 has the same text as Switch. Reuse the tested effect
// and register the printing used in today's lists.
export class SwitchMEG extends Switch {
  public set: string = 'MEG';

  public name: string = 'Switch';

  public fullName: string = 'Switch MEG';
}
