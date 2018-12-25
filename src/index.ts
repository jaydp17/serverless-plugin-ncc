import _ from 'lodash';
import path from 'path';
import makeDir from 'make-dir';
import Serverless from 'serverless';

import compiler from './compiler';
import parseServiceConfig, { IPackagingConfig } from './parse-service-config';
import zipper from './zipper';

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
    const dotServerlessPath = path.join(servicePath, '.serverless');
    await makeDir(dotServerlessPath);

    const packageFilesConfig = await parseServiceConfig(this.serverless);
    const packagingPromises = packageFilesConfig.map(async ({ zip, files }) => {
      const codeCompilePromises = files.map(({ absPath }) => compiler({ inputFilePath: absPath }));
      const compiledCodes = await Promise.all(codeCompilePromises);
      const zipperFiles = files.map((file, index) => ({
        data: compiledCodes[index],
        // here we're replacing files with `.ts` extensions to `.js`
        // as the `data` in the above live will already be a compiled JS file
        name: file.name.replace(/.ts$/, '.js'),
      }));
      await zipper({ zipPath: zip.absPath, zipContents: zipperFiles });
    });
    setArtifacts(this.serverless, packageFilesConfig);
    await Promise.all(packagingPromises);
    return undefined;
  }
}

function setArtifacts(serverless: Serverless, serviceFilesConfigArr: IPackagingConfig[]) {
  const individually = !!_.get(serverless, 'service.package.individually');
  if (!individually) {
    _.set(serverless, 'service.package.artifact', serviceFilesConfigArr[0].zip.absPath);
  } else {
    for (const { functionName, zip } of serviceFilesConfigArr) {
      if (!functionName) {
        throw new Error('functionName cannot be empty when packaging individually');
      }
      const slsFunction = serverless.service.getFunction(functionName);
      _.set(slsFunction, 'package.artifact', zip.absPath);
    }
  }
}
