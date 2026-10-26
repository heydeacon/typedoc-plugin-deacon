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
