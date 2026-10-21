import { CardManager } from '@ptcg/common';
import { baseSets, exSets, standardSets } from '@ptcg/sets';

/**
 * Registers the card sets with the CardManager singleton, mirroring the
 * formats defined by the server's init.js. Safe to call more than once.
 */
export function registerCardSets(): CardManager {
  const cardManager = CardManager.getInstance();
  const defined = cardManager.getAllFormats().map(f => f.name);

  if (!defined.includes('Standard')) {
    cardManager.defineFormat('Standard', [
      standardSets.setDiamondAndPearl,
      standardSets.setOp9,
      standardSets.setHgss,
      standardSets.setBlackAndWhite,
      standardSets.setBlackAndWhite2,
      standardSets.setBlackAndWhite3,
      standardSets.setBlackAndWhite4,
      standardSets.setSwordAndShield
    ]);
  }

  if (!defined.includes('EX Sets')) {
    cardManager.defineFormat('EX Sets', [
      exSets.setRubyAndSapphire,
      exSets.setSandstorm,
      exSets.setFireredAndLeafgreen
    ]);
  }

  if (!defined.includes('Base Sets')) {
    cardManager.defineFormat('Base Sets', [
      baseSets.setBase,
      baseSets.setJungle,
      baseSets.setFossil,
      baseSets.setTeamRocket
    ]);
  }

  return cardManager;
}
