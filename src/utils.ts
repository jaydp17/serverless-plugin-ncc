import fs from 'fs';
import path from 'path';
import { IFileNameAndPath } from './types';

export function doesFileExist(absFilePath: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.exists(absFilePath, resolve);
  });
}

/**
 * Takes the serverless.yml dir as the `serviceRoot` and the handler string that we specify in serverless.yml as `handler`
 * @example
 handlerFileDetails('/home/ubuntu/backend', 'src/index.handler');
 // {name: 'src/index.js', absPath: '/home/ubuntu/backend/src/index.js'}
 ```
 */
export async function handlerToFileDetails(
  serviceRoot: string,
  handler: string,
): Promise<IFileNameAndPath> {
  const lastDotIndex = handler.lastIndexOf('.');
  if (!lastDotIndex) throw new Error('invalid handler name');
  const fileNameWithoutExt = handler.substring(0, lastDotIndex);

  const tsFileName = `${fileNameWithoutExt}.ts`;
  const tsFilePath = path.join(serviceRoot, tsFileName);
  const tsFileExists = await doesFileExist(tsFilePath);
  if (tsFileExists) return { name: tsFileName, absPath: tsFilePath };

  const jsFileName = `${fileNameWithoutExt}.js`;
  const jsFilePath = path.join(serviceRoot, jsFileName);
  return { name: jsFileName, absPath: jsFilePath };
}
