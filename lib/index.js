const path = require('path');
const makeDir = require('make-dir');
const compiler = require('./compiler');
const zipper = require('./zipper');
const parseServiceConfig = require('./parse-service-config');

class ServerlessPlugin {
  constructor(serverless, options) {
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
    const zipPath = path.join(servicePath, `.serverless/${this.serverless.service.service}.zip`);
    this.serverless.service.artifact = zipPath;
    this.serverless.service.package = {
      artifact: zipPath,
    };
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
    await Promise.all(packagingPromises);
    return undefined;
  }
}

module.exports = ServerlessPlugin;
