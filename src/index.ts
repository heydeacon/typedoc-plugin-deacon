import { Application, JSX, ParameterType } from 'typedoc';
import type { ManuallyValidatedOption } from 'typedoc';

/**
 * Details about the reader that Deacon takes into account when it answers, the same on every
 * page. Up to 12 keys, each value a string, number or boolean.
 */
export type DeaconContext = Record<string, string | number | boolean>;

declare module 'typedoc' {
  export interface TypeDocOptionMap {
    deaconKey: string;
    deaconContext: ManuallyValidatedOption<DeaconContext | undefined>;
  }
}

const NAME = '@heydeacon/typedoc-plugin';
const LOADER_SRC = 'https://heydeacon.com/widget/v1/loader.js';

/** A value escaped for an HTML attribute in double quotes. */
function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/** The tag Install gives, with any of its other attributes between the key and async. */
function loaderTag(attributes: Record<string, string>): string {
  const rendered = Object.entries(attributes)
    .map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`)
    .join('');

  return `<script src="${LOADER_SRC}"${rendered} async></script>`;
}

/** TypeDoc calls this once when it loads the plugin named in the `plugin` option. */
export function load(app: Application): void {
  app.options.addDeclaration({
    name: 'deaconKey',
    help: 'Your Deacon key: the data-key value in the snippet on Install. It starts with pk_.',
    type: ParameterType.String,
  });

  app.options.addDeclaration({
    name: 'deaconContext',
    help:
      'Details about the reader that Deacon takes into account when it answers, the same on ' +
      'every page. Anyone can read them in the page, so never put a secret here.',
    type: ParameterType.Mixed,
    configFileOnly: true,
  });

  let tag = '';

  // Every option has been read by now. An error here stops the typedoc command before it
  // converts anything.
  app.on(Application.EVENT_BOOTSTRAP_END, () => {
    const key = app.options.getValue('deaconKey').trim();

    if (key === '') {
      app.logger.error(
        `${NAME}: the "deaconKey" option is missing. In Deacon, open Install (the button at ` +
          'the top of the dashboard) and copy the data-key value from the snippet. It starts ' +
          'with pk_.',
      );

      return;
    }

    const context = app.options.getValue('deaconContext');

    tag = loaderTag({
      'data-key': key,
      ...(context === undefined ? {} : { 'data-context': JSON.stringify(context) }),
    });
  });

  app.renderer.hooks.on('head.end', () => JSX.createElement(JSX.Raw, { html: tag }));
}
