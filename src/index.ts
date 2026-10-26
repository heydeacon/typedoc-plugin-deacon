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
    deaconPageViews: ManuallyValidatedOption<boolean>;
  }
}

const NAME = '@heydeacon/typedoc-plugin';
const LOADER_SRC = 'https://heydeacon.com/widget/v1/loader.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isScalar(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

function isContext(value: unknown): value is DeaconContext {
  return isRecord(value) && Object.values(value).every(isScalar);
}

/** A value escaped for an HTML attribute in double quotes. */
function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

/**
 * The tag Install gives, with any of its other attributes between the key and async. An
 * attribute that is `true` is written with no value, as `async` is.
 */
function loaderTag(attributes: Record<string, string | true>): string {
  const rendered = Object.entries(attributes)
    .map(([name, value]) => (value === true ? ` ${name}` : ` ${name}="${escapeAttribute(value)}"`))
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
    validate(value) {
      if (value !== undefined && !isContext(value)) {
        throw new Error(
          `${NAME}: the "deaconContext" option must be an object whose values are strings, ` +
            'numbers or booleans.',
        );
      }
    },
  });

  app.options.addDeclaration({
    name: 'deaconPageViews',
    help:
      'Set to false to send Deacon no page views or JavaScript errors from these pages. Chat ' +
      'still works.',
    // Mixed rather than Boolean: TypeDoc turns any value of a Boolean option into true or
    // false, so "false" in a config file would quietly mean true.
    type: ParameterType.Mixed,
    configFileOnly: true,
    defaultValue: true,
    validate(value) {
      if (typeof value !== 'boolean') {
        throw new Error(`${NAME}: the "deaconPageViews" option must be true or false.`);
      }
    },
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
    const pageViews = app.options.getValue('deaconPageViews');

    tag = loaderTag({
      'data-key': key,
      ...(context === undefined ? {} : { 'data-context': JSON.stringify(context) }),
      ...(pageViews ? {} : { 'data-no-page-views': true }),
    });
  });

  app.renderer.hooks.on('head.end', () => JSX.createElement(JSX.Raw, { html: tag }));
}
