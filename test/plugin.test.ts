import { describe, expect, it } from 'vitest';
import { generateDocs, loaderAttributesInHead, loaderTagsInHead } from './docs.js';

describe('@heydeacon/typedoc-plugin', () => {
  it('adds the tag from Install to the head of every page', async () => {
    const { pages } = await generateDocs({ deaconKey: 'pk_test123' });

    expect(pages.size).toBeGreaterThan(1);

    for (const [path, page] of pages) {
      expect({ path, tags: loaderTagsInHead(page) }).toEqual({
        path,
        tags: [
          '<script src="https://heydeacon.com/widget/v1/loader.js" data-key="pk_test123" async></script>',
        ],
      });
    }
  });

  it('trims spaces pasted around the key', async () => {
    const { pages } = await generateDocs({ deaconKey: '  pk_test123\n' });

    expect(loaderAttributesInHead(pages.get('index.html') ?? '')[0]?.['data-key']).toBe(
      'pk_test123',
    );
  });

  it('passes context to Deacon as the data-context attribute', async () => {
    const { pages } = await generateDocs({
      deaconKey: 'pk_test123',
      deaconContext: { site: 'docs', version: '3.2', beta: true },
    });

    expect(loaderAttributesInHead(pages.get('index.html') ?? '')).toEqual([
      {
        src: 'https://heydeacon.com/widget/v1/loader.js',
        'data-key': 'pk_test123',
        'data-context': '{"site":"docs","version":"3.2","beta":true}',
        async: '',
      },
    ]);
  });

  it('keeps a context value that looks like HTML as it was written', async () => {
    const { pages } = await generateDocs({
      deaconKey: 'pk_test123',
      deaconContext: { note: '</script><b>"hi" &amp;</b>' },
    });

    expect(loaderAttributesInHead(pages.get('index.html') ?? '')[0]?.['data-context']).toBe(
      '{"note":"</script><b>\\"hi\\" &amp;</b>"}',
    );
  });

  it.each([
    ['a string', 'plan=pro'],
    ['an array', ['docs']],
    ['an object with a nested value', { plan: { tier: 'pro' } }],
    ['an object with a null value', { plan: null }],
  ])('refuses a context that is %s', async (_case, deaconContext) => {
    // @ts-expect-error -- a typedoc.json can hold any of these
    const { errors, pages } = await generateDocs({ deaconKey: 'pk_test123', deaconContext });

    expect({ errors, pages: pages.size }).toEqual({
      errors: [
        '@heydeacon/typedoc-plugin: the "deaconContext" option must be an object whose ' +
          'values are strings, numbers or booleans.',
      ],
      pages: 0,
    });
  });

  it.each([
    ['missing', {}],
    ['empty, as from an unset environment variable', { deaconKey: '' }],
    ['blank', { deaconKey: '   ' }],
  ])('stops the build when the key is %s', async (_case, options) => {
    const { errors, pages } = await generateDocs(options);

    expect({ errors, pages: pages.size }).toEqual({
      errors: [
        '@heydeacon/typedoc-plugin: the "deaconKey" option is missing. In Deacon, open ' +
          'Install (the button at the top of the dashboard) and copy the data-key value from ' +
          'the snippet. It starts with pk_.',
      ],
      pages: 0,
    });
  });
});
