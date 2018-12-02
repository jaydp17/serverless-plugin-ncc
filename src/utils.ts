export function handlerToFileName(handler: string) {
  const lastDotIndex = handler.lastIndexOf('.');
  if (!lastDotIndex) throw new Error('invalid handler name');
  return `${handler.substring(0, lastDotIndex)}.js`;
}
