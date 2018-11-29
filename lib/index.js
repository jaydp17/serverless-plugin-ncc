'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const compiler = require('./compiler');
const zipper = require('./zipper');

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
    const servicePath = this.serverless.config.servicePath;
    const zipPath = path.join(servicePath, `.serverless/${this.serverless.service.service}.zip`);
    this.serverless.service.artifact = zipPath;
    this.serverless.service.package = {
      artifact: zipPath,
    };
    try {
      fs.mkdirSync(path.join(servicePath, '.serverless'));
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    const handlerPath = path.join(servicePath, 'handler.js');
    const code = await compiler({ inputFilePath: handlerPath });
    await zipper({ zipPath, zipContents: [{ data: code, name: 'handler.js' }] });
    return undefined;
  }
}

module.exports = ServerlessPlugin;
