import { CompiledOutput } from '@zeit/ncc';
import _ from 'lodash';
import path from 'path';
import makeDir from 'make-dir';
import Serverless from 'serverless';

import compiler from './compiler';
import parseServiceConfig, { IPackagingConfig } from './parse-service-config';
import { IFileNameAndPath } from './types';
import zipper, { ZipContent } from './zipper';

export default class ServerlessPlugin {
  serverless: Serverless;
  options: Serverless.Options;
  hooks: { [key in string]: Function };
  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:package:createDeploymentArtifacts': this.package.bind(this),
      'before:package:finalize': this.packageFinalize.bind(this),
    };
  }

  packageFinalize() {
    this.serverless.cli.log('packageFinalize');
  }

  async package() {
    this.serverless.cli.log('running ncc');
    const { servicePath } = this.serverless.config;
    const slsService = this.serverless.service;
    const globalNccConfig = (slsService && slsService.custom && slsService.custom.ncc) || {};
    const dotServerlessPath = path.join(servicePath, '.serverless');
    await makeDir(dotServerlessPath);

    const packageFilesConfig = await parseServiceConfig(this.serverless);
    const packagingPromises = packageFilesConfig.filter(Boolean).map(async (pkg) => {
      const { zip, files, perFunctionNccConfig = {} } = pkg;
      const nccConfig = Object.assign({}, globalNccConfig, perFunctionNccConfig);
      // For now pass all ncc options directly to ncc. This has the benefit of testing out new
      // ncc releases and changes quickly. Later it would be nice to add a validation step in between.
      const codeCompilePromises = files.map(({ absPath }) =>
        compiler({ inputFilePath: absPath, ...nccConfig }),
      );
      const compiledCodes = await Promise.all(codeCompilePromises);
      const zipperFiles = createZipperFiles(files, compiledCodes);
      await zipper({ zipPath: zip.absPath, zipContents: zipperFiles });
    });
    setArtifacts(this.serverless, packageFilesConfig);
    await Promise.all(packagingPromises);
    return undefined;
  }
}

function createZipperFiles(
  files: IFileNameAndPath[],
  compiledCodes: CompiledOutput[],
): ZipContent[] {
  if (files.length !== compiledCodes.length) {
    throw new Error('Expecting NCC output for all files.');
  }

  const content: ZipContent[] = [];

  files.forEach((file, index) => {
    const compilerOutput = compiledCodes[index];

    content.push({
      data: compilerOutput.code,
      // here we're replacing files with `.ts` extensions to `.js`
      // as the `data` in the above live will already be a compiled JS file
      name: file.name.replace(/.ts$/, '.js'),
    });

    if (compilerOutput.map) {
      content.push({
        data: compilerOutput.map,
        // Make sure to rename the map the same way as the compiled output.
        name: file.name.replace(/.ts$/, '.map.js'),
      });
    }

    if (compilerOutput.assets) {
      // Assets are relative to the 'code' file. But because of keeping the file
      // structure in the zip output all assets need to be written to the same directory.
      // The 'lastIndexOf() + 1' makes sure to keep the trailing slash.
      const path = file.name.substring(0, file.name.lastIndexOf('/') + 1);

      Object.keys(compilerOutput.assets).forEach(assetName => {
        if (!Object.prototype.hasOwnProperty.call(compilerOutput.assets, assetName)) {
          return;
        }

        content.push({
          data: compilerOutput.assets![assetName].source,
          name: `${path}${assetName}`,
          mode: compilerOutput.assets![assetName].permissions,
        });
      });
    }
  });

  return content;
}

function setArtifacts(serverless: Serverless, serviceFilesConfigArr: IPackagingConfig[]) {
  const individually = !!_.get(serverless, 'service.package.individually');
  if (!individually) {
    _.set(serverless, 'service.package.artifact', serviceFilesConfigArr[0].zip.absPath);
  } else {
    for (const cnf of serviceFilesConfigArr) {
      if (!cnf) {
        continue;
      }

      const { functionName, zip } = cnf;
      if (!functionName) {
        throw new Error('functionName cannot be empty when packaging individually');
      }
      const slsFunction = serverless.service.getFunction(functionName);
      _.set(slsFunction, 'package.artifact', zip.absPath);
    }
  }
}
