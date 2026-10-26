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
});
