import { Card } from '@ptcg/common';
import { TeamRocketsAriana } from './team-rockets-ariana';
import { TeamRocketsFactory } from './team-rockets-factory';
import { TeamRocketsGiovanni } from './team-rockets-giovanni';
import { TeamRocketsPetrel } from './team-rockets-petrel';
import { TeamRocketsTransceiver } from './team-rockets-transceiver';

export const setDestinedRivals: Card[] = [
  new TeamRocketsAriana(),
  new TeamRocketsFactory(),
  new TeamRocketsGiovanni(),
  new TeamRocketsPetrel(),
  new TeamRocketsTransceiver(),
];
