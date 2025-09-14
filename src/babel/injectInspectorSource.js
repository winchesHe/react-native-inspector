module.exports = function injectInspectorSource(babel) {
  const t = babel.types;
  const path = require('path');

  function getElementName(nameNode) {
    if (t.isJSXIdentifier(nameNode)) return nameNode.name;
    if (t.isJSXMemberExpression(nameNode)) return nameNode.property.name;
    return 'Unknown';
  }

  function isFragmentName(name) {
    return name === 'Fragment';
  }

  return {
    name: 'inject-inspector-source',
    visitor: {
      JSXElement(pathNode, state) {
        const opening = pathNode.node.openingElement;
        const elementName = getElementName(opening.name);

        // Skip Fragment elements (cannot accept arbitrary attributes)
        if (isFragmentName(elementName)) return;

        const options = state.opts || {};
        const propName = options.propName || '__inspectorSource';

        // Skip if already has the prop
        const hasProp = opening.attributes.some(
          (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === propName,
        );
        if (hasProp) return;

        const loc = pathNode.node.loc;
        if (!loc) return;

        const filename = (state.file && state.file.opts && state.file.opts.filename) || 'unknown';

        // Prefer a readable display path relative to cwd; if under src/, keep from src/
        const relFromCwd = path.isAbsolute(filename) ? path.relative(process.cwd(), filename) : filename;
        let displayPath = relFromCwd || filename;
        const srcIdx = displayPath.lastIndexOf(`${path.sep}src${path.sep}`);
        if (srcIdx !== -1) {
          displayPath = displayPath.substring(srcIdx + 1); // keep from `src/...`
        }

        const start = loc.start; // { line: number (1-based), column: number (0-based) }

        const valueObject = t.objectExpression([
          // display path for UI
          t.objectProperty(t.identifier('file'), t.stringLiteral(displayPath)),
          t.objectProperty(t.identifier('line'), t.numericLiteral(start.line)),
          t.objectProperty(t.identifier('column'), t.numericLiteral(start.column)),
          t.objectProperty(t.identifier('element'), t.stringLiteral(elementName)),
        ]);

        const attr = t.jsxAttribute(
          t.jsxIdentifier(propName),
          t.jsxExpressionContainer(valueObject),
        );

        opening.attributes.push(attr);
      },
    },
  };
};

