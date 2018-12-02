import _ from 'lodash';
import path from 'path';
import makeDir from 'make-dir';
import Serverless from 'serverless';

import compiler from './compiler';
import parseServiceConfig from './parse-service-config';
const zipper = require('./zipper');

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

    const packageFilesConfig = parseServiceConfig(this.serverless);
    const packagingPromises = packageFilesConfig.map(async ({ zip, files }) => {
      const codeCompilePromises = files.map(({ absPath }) => compiler({ inputFilePath: absPath }));
      const compiledCodes = await Promise.all(codeCompilePromises);
      const zipperFiles = files.map((file, index) => ({
        data: compiledCodes[index],
        name: file.name,
      }));
      await zipper({ zipPath: zip.absPath, zipContents: zipperFiles });
    });
    setArtifacts(this.serverless, packageFilesConfig);
    await Promise.all(packagingPromises);
    return undefined;
  }
}

/**
 * @param {*} serverless
 * @param {ServiceFilesConfig[]} serviceFilesConfigArr
 */
function setArtifacts(serverless, serviceFilesConfigArr) {
  const individually = !!_.get(serverless, 'service.package.individually');
  if (!individually) {
    _.set(serverless, 'service.package.artifact', serviceFilesConfigArr[0].zip.absPath);
  } else {
    for (const { functionName, zip } of serviceFilesConfigArr) {
      const slsFunction = serverless.service.getFunction(functionName);
      _.set(slsFunction, 'package.artifact', zip.absPath);
    }
  }
}

module.exports = ServerlessPlugin;
