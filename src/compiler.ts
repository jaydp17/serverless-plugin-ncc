import zeitNcc from '@zeit/ncc';

export default async function compile({ inputFilePath, ...options }: { inputFilePath: string, [key: string]: any }) {
  return zeitNcc(inputFilePath, { minify: false, ...options });
}
