import zeitNcc from '@zeit/ncc';

export default async function compile({ inputFilePath }: { inputFilePath: string }) {
  const { code } = await zeitNcc(inputFilePath, { minify: false });
  return code;
}
