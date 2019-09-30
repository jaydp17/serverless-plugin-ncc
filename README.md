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

## Pass options

Custom options can be passed to ncc like this:
```yml
# serverless.yml

custom:
  ncc:
    minify: true
```
Note that all options are currently passed directly to ncc. To view all possible options
check the [ncc docs](https://github.com/zeit/ncc#programmatically-from-nodejs)

## Pass custom options per-function

Passing custom options to a function is as simple as introducing a custom block under the function with your ncc config

```yml
# serverless.yml

functions:
  hello:
    handler: src/hello/index.hello
    custom:
      ncc:
        minify: false
```

## Disable ncc per function

You can pass `enabled: false` as custom config per function to disable ncc on that function

```yml
# serverless.yml

functions:
  hello:
    handler: src/hello/index.hello
    custom:
      ncc:
        enabled: false
```

## License

MIT
