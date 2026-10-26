import { Application, JSX, ParameterType } from 'typedoc';

declare module 'typedoc' {
  export interface TypeDocOptionMap {
    deaconKey: string;
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

/** The tag Install gives, with the attributes in its order. */
function loaderTag(key: string): string {
  return `<script src="${LOADER_SRC}" data-key="${escapeAttribute(key)}" async></script>`;
}

/** TypeDoc calls this once when it loads the plugin named in the `plugin` option. */
export function load(app: Application): void {
  app.options.addDeclaration({
    name: 'deaconKey',
    help: 'Your Deacon key: the data-key value in the snippet on Install. It starts with pk_.',
    type: ParameterType.String,
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

    tag = loaderTag(key);
  });

  app.renderer.hooks.on('head.end', () => JSX.createElement(JSX.Raw, { html: tag }));
}
