declare module '@zeit/ncc' {
  type CompiledOutput = { code: string; assets?: string; map?: string };
  type CompilerOptions = { minify?: boolean; externals?: string[]; sourceMap?: boolean };
  export default function(inputFilePath: string, options: CompilerOptions): CompiledOutput;
}
