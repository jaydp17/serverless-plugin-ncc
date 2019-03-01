import fs from 'fs';
import archiver from 'archiver';

export type ZipContent = {
  data: string | Buffer;
  name: string;
}

type CreateZipOptions = {
  zipPath: string;
  zipContents: ZipContent[];
};
export default async function createZip({ zipPath, zipContents }: CreateZipOptions) {
  const zipStream = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    zipStream.on('close', () => {
      const totalBytes = archive.pointer();
      console.log(`${totalBytes} total bytes`);
      console.log('archiver has been finalized and the output file descriptor has closed.');
      resolve({ totalBytes });
    });

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    zipStream.on('end', () => {
      console.log('Data has been drained');
    });

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', err => {
      if (err.code === 'ENOENT') {
        // log warning
      } else {
        // throw error
        throw err;
      }
    });

    // good practice to catch this error explicitly
    archive.on('error', err => {
      console.error('archive error', err);
      reject(err);
    });

    // pipe archive data to the file
    archive.pipe(zipStream);

    for (const zipContent of zipContents) {
      archive.append(zipContent.data, { name: zipContent.name });
    }
    archive.finalize();
  });
}
