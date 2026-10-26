import { JSX, ParameterType } from 'typedoc';
import type { Application } from 'typedoc';

declare module 'typedoc' {
  export interface TypeDocOptionMap {
    deaconKey: string;
  }
}

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

  app.renderer.hooks.on('head.end', () =>
    JSX.createElement(JSX.Raw, { html: loaderTag(app.options.getValue('deaconKey')) }),
  );
}
