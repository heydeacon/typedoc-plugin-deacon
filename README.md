# @heydeacon/typedoc-plugin

[Deacon](https://heydeacon.com) is an AI support agent that answers questions from your own docs and content, and says when it doesn't know. This plugin adds its chat widget to every page TypeDoc generates.

You need a Deacon account, and there's a free plan.

## Install

```sh
npm install --save-dev @heydeacon/typedoc-plugin
```

## Set it up

Add the plugin and your key to `typedoc.json`:

```json
{
  "plugin": ["@heydeacon/typedoc-plugin"],
  "deaconKey": "pk_your_widget_key"
}
```

The key works on the command line too: `npx typedoc --plugin @heydeacon/typedoc-plugin --deaconKey pk_your_widget_key`.

To find your key, open Install from the button at the top of the Deacon dashboard. The snippet there has it in `data-key`, and it starts with `pk_`. If the key is missing, or an option has the wrong type, TypeDoc stops before it builds and says why.

Deacon only runs on the sites listed on Install. A listed domain covers its subdomains, so `example.com` covers `docs.example.com`. If your docs live somewhere else, such as `example.github.io`, add that address on Install too.

TypeDoc writes plain HTML files. To try the widget before you deploy, serve the output folder on localhost, for example with `npx serve docs`. Install notices the widget there and lets you add it in one click. Chats on localhost don't count towards your plan.

## Options

| Option            | Type    | Default  | What it does |
| ----------------- | ------- | -------- | ------------ |
| `deaconKey`       | string  | required | Your Deacon key. |
| `deaconContext`   | object  | none     | Details Deacon takes into account when it answers, the same on every page, such as `{ "product": "api", "docsVersion": "3.2" }`. Up to 12 keys, each value a string, number or boolean. Anyone can read them in the page's HTML, so never put a secret here. |
| `deaconPageViews` | boolean | `true`   | The same script counts visits for Deacon's website analytics. Set this to `false` to send no page views or JavaScript errors from your docs. Chat still works. |

Set `deaconContext` and `deaconPageViews` in `typedoc.json`, since they don't work on the command line:

```json
{
  "plugin": ["@heydeacon/typedoc-plugin"],
  "deaconKey": "pk_your_widget_key",
  "deaconContext": { "product": "api", "docsVersion": "3.2" },
  "deaconPageViews": false
}
```

## Opening the chat from your own button

The widget comes with its own button. To use one of yours instead, hide Deacon's in Appearance in the dashboard and call `window.Deacon.open()` from your button or link. `Deacon.close()` and `Deacon.toggle()` work too.

## What it adds

The plugin puts the same tag Install gives you in the head of every page:

```html
<script src="https://heydeacon.com/widget/v1/loader.js" data-key="pk_your_widget_key" async></script>
```

It loads in the background without holding up the page. Works with TypeDoc 0.28.

## License

MIT
