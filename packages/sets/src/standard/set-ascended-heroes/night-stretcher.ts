import { NightStretcher } from '../set-shrouded-fable/night-stretcher';

// Ascended Heroes 196 is mechanically identical to the Shrouded Fable
// printing. Reuse the effect while registering the exact physical printing.
export class NightStretcherASC extends NightStretcher {
  public set: string = 'ASC';

  public name: string = 'Night Stretcher';

  public fullName: string = 'Night Stretcher ASC';
}
