import { Card } from '@ptcg/common';
import { ScansDownloader } from './scans-downloader';

/** The private members these specs stand in for. */
interface DownloaderInternals {
  listCardsToDownload(): Promise<Card[]>;
  createDirectoryForFile(filePath: string): Promise<void>;
  downloadFile(url: string, filePath: string): Promise<void>;
}

/**
 * A missing card scan must never stop the server from starting.
 *
 * Card images are decoration; the game plays fine without them, and newly
 * added cards routinely have no scan published yet. Before this was guarded, a
 * single 404 rejected downloadAllMissingCards(), start.js caught it and called
 * process.exit(1), so a fresh install could not boot once any card in the pool
 * had no scan upstream.
 */
describe('ScansDownloader', () => {

  let downloader: ScansDownloader;
  let internals: DownloaderInternals;
  let attempted: string[];

  // Stands in for the three cards the real run would look up.
  function withCards(count: number): void {
    const cards = Array.from({ length: count },
      (_, i) => ({ fullName: `Card ${i}`, set: 'TEST' }) as Card);
    spyOn(internals, 'listCardsToDownload').and.returnValue(Promise.resolve(cards));
  }

  beforeEach(() => {
    downloader = new ScansDownloader();
    internals = downloader as unknown as DownloaderInternals;
    attempted = [];
    spyOn(internals, 'createDirectoryForFile').and.returnValue(Promise.resolve());
  });

  it('keeps going when one scan is missing, and still resolves', async () => {
    withCards(3);
    spyOn(internals, 'downloadFile').and.callFake((url: string) => {
      attempted.push(url);
      return url.includes('Card 1')
        ? Promise.reject(new Error('Cannot download file: ' + url))
        : Promise.resolve();
    });

    await expectAsync(downloader.downloadAllMissingCards()).toBeResolved();
    expect(attempted.length).toBe(3);
  });

  it('still resolves when every scan is missing', async () => {
    withCards(2);
    spyOn(internals, 'downloadFile').and.callFake((url: string) => {
      attempted.push(url);
      return Promise.reject(new Error('Cannot download file: ' + url));
    });

    await expectAsync(downloader.downloadAllMissingCards()).toBeResolved();
    expect(attempted.length).toBe(2);
  });

  it('does not let a directory failure stop the other cards', async () => {
    withCards(3);
    internals.createDirectoryForFile = (filePath: string) => filePath.includes('Card 0')
      ? Promise.reject(new Error('mkdir failed'))
      : Promise.resolve();
    spyOn(internals, 'downloadFile').and.callFake((url: string) => {
      attempted.push(url);
      return Promise.resolve();
    });

    await expectAsync(downloader.downloadAllMissingCards()).toBeResolved();
    // Card 0 never reached downloadFile, the other two did
    expect(attempted.length).toBe(2);
  });

  it('downloads nothing when every scan is already on disk', async () => {
    withCards(0);
    const downloadFile = spyOn(internals, 'downloadFile');

    await expectAsync(downloader.downloadAllMissingCards()).toBeResolved();
    expect(downloadFile).not.toHaveBeenCalled();
  });

});
