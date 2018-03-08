import path from 'path';
import i18next from 'i18next';
import nodeFsPlugin from 'i18next-node-fs-backend';
import { LanguageDetector } from 'i18next-express-middleware';

i18next
  .use(nodeFsPlugin)
  .use(LanguageDetector)
  .init({
    preload: ['en'],
    ns: ['main'],
    defaultNS: 'main',
    fallbackLng: 'en',
    fallbackNS: 'main',
    backend: {
      // path where resources get loaded from
      loadPath: path.join(__dirname, '../../locales/{{lng}}/{{ns}}.json'),
      // path to post missing resources
      addPath: path.join(
        __dirname,
        '../../locales/{{lng}}/{{ns}}.missing.json',
      ),
      // jsonIndent to use when storing json files
      jsonIndent: 2,
    },
    detection: {
      order: ['header'],
    },
    debug: false,
    initImmediate: true,
  });

export default i18next;
