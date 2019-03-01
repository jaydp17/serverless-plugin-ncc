import zeitNcc from '@zeit/ncc';

export default async function compile({ inputFilePath }: { inputFilePath: string }, opts: any) {
  return zeitNcc(inputFilePath, { minify: false, ...opts });
}
