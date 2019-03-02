declare module '@zeit/ncc' {
  type Asset = { source: Buffer; };
  export type CompiledOutput = { code: string; assets?: { [key: string]: Asset }; map?: string };
  type CompilerOptions = { minify?: boolean; externals?: string[]; sourceMap?: boolean };
  export default function(inputFilePath: string, options: CompilerOptions): CompiledOutput;
}
