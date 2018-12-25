# serverless-plugin-ncc

A serverless plugin to use [@zeit/ncc](https://www.npmjs.com/package/@zeit/ncc) for compiling code before packaging.

## Usage

```sh
npm install -D serverless-plugin-ncc @zeit/ncc
```

`@zeit/ncc` is a peer dependency, so we'll have to install it separately.

Add the pluging to `serverless.yml`

```yml
plugins:
  - serverless-plugin-ncc
```

## How to use with TypeScript files?

```yml
# serverless.yml

functions:
  typescriptFn:
    # the plugin checks for src/index.ts as well as src/index.js
    # whichever exists is picked up
    handler: src/index.handler
```

## License

MIT
