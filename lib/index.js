'use strict';

const path = require('path');
const fs = require('fs');
const ncc = require('@zeit/ncc');

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

  package() {
    this.serverless.cli.log('running ncc');
    const servicePath = this.serverless.config.servicePath;
    const zipPath = path.join(servicePath, `.serverless/${this.serverless.service.service}.zip`);
    const dummyPath = path.join(servicePath, 'dummy.zip');
    this.serverless.service.artifact = dummyPath;
    this.serverless.service.package = {
      artifact: dummyPath,
    };
    fs.mkdirSync(path.join(servicePath, '.serverless'));
    const handlerPath = path.join(servicePath, 'handler.js');
    return ncc(handlerPath, {
      minify: false,
    })
      .then(({ code, assets }) => {
        console.log(code);
        // assets is an object of asset file names to sources
        // expected relative to the output code (if any)
      })
      .catch(error => {
        console.error(error);
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          fs.copyFile(dummyPath, zipPath, err => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
  }
}

module.exports = ServerlessPlugin;
