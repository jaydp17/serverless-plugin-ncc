/**
 *
 * @param {string} handler
 */
function handlerToFileName(handler) {
  const lastDotIndex = handler.lastIndexOf('.');
  if (!lastDotIndex) throw new Error('invalid handler name');
  return `${handler.substring(0, lastDotIndex)}.js`;
}

module.exports = { handlerToFileName };
