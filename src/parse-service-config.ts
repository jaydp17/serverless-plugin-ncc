import _ from 'lodash';
import path from 'path';
import { handlerToFileDetails } from './utils';
import Serverless from 'serverless';
import { ServerlessFunctionDefinition, IFileNameAndPath } from './types';

export default function parseServiceConfig(serverless: Serverless) {
  const individually = !!_.get(serverless, 'service.package.individually');
  if (individually) {
    return packageIndividually(serverless);
  }
  return packageAllTogether(serverless);
}

export interface IPackagingConfig {
  functionName?: string;
  zip: IFileNameAndPath;
  files: IFileNameAndPath[];
}
async function packageIndividually(serverless: Serverless): Promise<IPackagingConfig[]> {
  const { servicePath } = serverless.config;
  // @ts-ignore
  const functions: { [key: string]: ServerlessFunctionDefinition } = serverless.service.functions;
  const serviceFilesConfigArrPromises = _.map(
    functions,
    async ({ name: serviceName, handler, custom = {} }, functionName) => {
      if (custom && custom.ncc && custom.ncc.enabled === false) {
        return;
      }

      const { name: fileName, absPath: filePath } = await handlerToFileDetails(
        servicePath,
        handler,
      );
      const zipName = `${serviceName}.zip`;
      const zipPath = path.join(servicePath, `.serverless/${zipName}`);
      return {
        ncc: _.get(custom, 'ncc', {}),
        functionName,
        zip: {
          absPath: zipPath,
          name: zipName,
        },
        files: [
          {
            name: fileName,
            absPath: filePath,
          },
        ],
      };
    },
  );
  const serviceFilesConfigArr = await Promise.all(serviceFilesConfigArrPromises);
  return serviceFilesConfigArr;
}

async function packageAllTogether(serverless: Serverless): Promise<IPackagingConfig[]> {
  const { servicePath } = serverless.config;
  const zipName = `${serverless.service.getServiceName()}.zip`;
  const zipPath = path.join(servicePath, `.serverless/${zipName}`);
  // @ts-ignore
  const functions: ServerlessFunctionDefinition[] = Object.values(serverless.service.functions);
  const filesPromises = functions.map(async ({ handler }) => {
    const { name, absPath } = await handlerToFileDetails(servicePath, handler);
    return { name, absPath };
  });
  const files = await Promise.all(filesPromises);
  return [{ zip: { name: zipName, absPath: zipPath }, files }];
}
