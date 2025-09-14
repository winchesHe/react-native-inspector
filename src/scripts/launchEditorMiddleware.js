const launch = require('launch-editor');
const url = require('url');
const path = require('path');
const { ROOT } = require('./path');

function launchEditorMiddleware() {
  return (req, res, next) => {
    try {
      const parsed = url.parse(req.url || '', true);
      if (parsed.pathname && parsed.pathname.includes('/__open-in-editor')) {
        const file = parsed.query && parsed.query.file;
        if (!file) {
          // eslint-disable-next-line no-console
          console.error('launch-editor-middleware: required query param "file" is missing.');
          res && res.end && res.end('Missing file');
          return;
        }
        const absPath = path.resolve(ROOT, String(file));
        // eslint-disable-next-line no-console
        console.log('\x1b[96m%s\x1b[0m', `🚀 ~ launch ~ file: ${absPath}`);

        launch(absPath, 'code', () => {
          // eslint-disable-next-line no-console
          console.error(`Unable to open ${absPath}`);
        });

        res && res.end && res.end('OK');
        return;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('launch-editor-middleware error:', e);
    }
    if (typeof next === 'function') return next();
  };
}

module.exports = { launchEditorMiddleware };


