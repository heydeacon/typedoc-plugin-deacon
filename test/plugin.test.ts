import { describe, expect, it } from 'vitest';
import { generateDocs, loaderAttributesInHead, loaderTagsInHead } from './docs.js';

/** The project's front page, which every option shows on. */
function indexPage(pages: Map<string, string>): string {
  return pages.get('index.html') ?? '';
}

describe('@heydeacon/typedoc-plugin', () => {
  it('adds the tag from Install to the head of every page', async () => {
    const { pages } = await generateDocs({ deaconKey: 'pk_test123' });
    const tag =
      '<script src="https://heydeacon.com/widget/v1/loader.js" data-key="pk_test123" async></script>';

    expect(
      Object.fromEntries([...pages].map(([path, page]) => [path, loaderTagsInHead(page)])),
    ).toEqual({
      'classes/Thing.html': [tag],
      'functions/greet.html': [tag],
      'hierarchy.html': [tag],
      'index.html': [tag],
      'modules.html': [tag],
    });
  });

  it('trims spaces pasted around the key', async () => {
    const { pages } = await generateDocs({ deaconKey: '  pk_test123\n' });

    expect(loaderAttributesInHead(indexPage(pages))[0]?.['data-key']).toBe('pk_test123');
  });

  it('passes context to Deacon as the data-context attribute', async () => {
    const { pages } = await generateDocs({
      deaconKey: 'pk_test123',
      deaconContext: { site: 'docs', version: '3.2', beta: true },
    });

    expect(loaderAttributesInHead(indexPage(pages))).toEqual([
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

    expect(loaderAttributesInHead(indexPage(pages))[0]?.['data-context']).toBe(
      '{"note":"</script><b>\\"hi\\" &amp;</b>"}',
    );
  });

  it('holds back page views with the data-no-page-views attribute', async () => {
    const { pages } = await generateDocs({ deaconKey: 'pk_test123', deaconPageViews: false });

    expect(loaderTagsInHead(indexPage(pages))).toEqual([
      '<script src="https://heydeacon.com/widget/v1/loader.js" data-key="pk_test123" data-no-page-views async></script>',
    ]);
  });

  it('refuses a deaconPageViews that is not true or false', async () => {
    const { errors, pages } = await generateDocs({
      deaconKey: 'pk_test123',
      // @ts-expect-error -- a typedoc.json can hold a string
      deaconPageViews: 'false',
    });

    expect({ errors, pages: pages.size }).toEqual({
      errors: ['@heydeacon/typedoc-plugin: the "deaconPageViews" option must be true or false.'],
      pages: 0,
    });
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
