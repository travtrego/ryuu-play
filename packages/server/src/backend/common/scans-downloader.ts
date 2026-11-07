import { Card, CardManager } from '@ptcg/common';
import { access, constants, createWriteStream, mkdir, unlink } from 'node:fs';
import { dirname } from 'node:path';
import { get as httpGet } from 'node:http';
import { get as httpsGet } from 'node:https';

import { config } from '../../config';


export class ScansDownloader {

  public async downloadAllMissingCards(): Promise<void> {
    const cardsToDownload = await this.listCardsToDownload();

    if (cardsToDownload.length === 0) {
      return;
    }

    console.log(`Cards with missing scans: ${cardsToDownload.length}.`);
    console.log('Downloading missing images, please wait...');

    // A scan that cannot be downloaded must not stop the server from starting.
    // Card images are decoration: the game is perfectly playable without them,
    // and newly added cards routinely have no scan published yet. Before this,
    // one missing file rejected the whole run and start.js exited 1, so a fresh
    // install could not boot at all.
    const failed: string[] = [];

    for (let i = 0; i < cardsToDownload.length; i++) {
      const card = cardsToDownload[i];
      const filePath = config.sets.scansDir + this.getCardPath(card);
      const downloadUrl = config.sets.scansDownloadUrl + this.getCardPath(card);
      console.log(`File (${i + 1}/${cardsToDownload.length}): ${downloadUrl}`);

      try {
        await this.createDirectoryForFile(filePath);
        await this.downloadFile(downloadUrl, filePath);
      } catch (error) {
        failed.push(downloadUrl);
      }
    }

    if (failed.length > 0) {
      console.log(`Could not download ${failed.length} of ${cardsToDownload.length} scans. `
        + 'Those cards will show a placeholder image; everything else works as normal.');
      failed.slice(0, 5).forEach(url => console.log(`  missing: ${url}`));
      if (failed.length > 5) {
        console.log(`  ... and ${failed.length - 5} more.`);
      }
    }
  }

  /** The cards whose scan is not on disk yet. */
  private async listCardsToDownload(): Promise<Card[]> {
    const cardManager = CardManager.getInstance();
    const cards = cardManager.getAllCards();
    const cardsToDownload: Card[] = [];

    for (const card of cards) {
      const filePath = config.sets.scansDir + this.getCardPath(card);
      const exists = await this.fileExists(filePath);
      if (!exists) {
        cardsToDownload.push(card);
      }
    }

    return cardsToDownload;
  }

  private getCardPath(card: Card): string {
    return config.sets.scansUrl
      .replace('/scans', '')
      .replace(/{name}/g, card.fullName)
      .replace(/{set}/g, card.set);
  }

  private fileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      access(filePath, constants.F_OK, err => {
        resolve(err ? false: true);
      });
    });
  }

  private createDirectoryForFile(filePath: string): Promise<void> {
    const fileDir = dirname(filePath);
    return new Promise((resolve, reject) => {
      mkdir(fileDir, { recursive: true }, err => err ? reject(err) : resolve());
    });
  }

  private downloadFile(url: string, filePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const get = url.startsWith('https://') ? httpsGet : httpGet;

      const request = get(url, response => {
        if (response.statusCode !== 200) {
          return reject(new Error('Cannot download file: ' + url));
        }

        const file = createWriteStream(filePath);
        file.on('finish', () => file.close(() => resolve()));

        file.on('error', err => {
          unlink(filePath, () => reject(err)); // delete the (partial) file and then return the error
        });

        response.pipe(file);
      });

      request.on('error', err => {
        unlink(filePath, () => reject(err)); // delete the (partial) file and then return the error
      });
    });
  }

}
