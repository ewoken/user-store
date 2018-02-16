import path from 'path';
import i18next from 'i18next';
import nodeFsPlugin from 'i18next-node-fs-backend';

i18next.use(nodeFsPlugin).init({
  preload: ['en'],
  ns: ['main'],
  defaultNS: 'main',
  fallbackNS: 'common',
  backend: {
    // path where resources get loaded from
    loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json'),
    // path to post missing resources
    addPath: path.join(__dirname, '/locales/{{lng}}/{{ns}}.missing.json'),
    // jsonIndent to use when storing json files
    jsonIndent: 2,
  },
  initImmediate: true,
});

export default function i18n(key) {
  return i18next.t(key);
}
