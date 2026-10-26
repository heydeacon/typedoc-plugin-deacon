import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { Application, Logger, LogLevel, TSConfigReader } from 'typedoc';
import type { TypeDocOptions } from 'typedoc';
import { load } from '../src/index.js';

/** With forward slashes, since TypeDoc reads entry points as globs. */
const FIXTURE = join(import.meta.dirname, 'fixture').replaceAll('\\', '/');

const LOADER_TAG =
  /<script\b[^>]*\bsrc="https:\/\/heydeacon\.com\/widget\/v1\/loader\.js"[^>]*><\/script>/g;

export interface Docs {
  /** Every error TypeDoc logged. The command line stops on any of them. */
  errors: string[];
  /** Each page TypeDoc wrote, by its path in the output folder. */
  pages: Map<string, string>;
}

class RecordingLogger extends Logger {
  readonly errors: string[] = [];

  override log(message: string, level: LogLevel): void {
    super.log(message, level);

    if (level === LogLevel.Error) {
      this.errors.push(message);
    }
  }
}

/**
 * Runs TypeDoc with the plugin on a small project, as the `typedoc` command does. When an
 * option is refused, the command line stops before it converts anything, so this does too.
 */
export async function generateDocs(options: TypeDocOptions): Promise<Docs> {
  const logger = new RecordingLogger();
  const app = await Application.bootstrapWithPlugins(
    {
      ...options,
      tsconfig: join(FIXTURE, 'tsconfig.json'),
      entryPoints: [`${FIXTURE}/index.ts`],
      plugin: [
        (app) => {
          app.logger = logger;
        },
        load,
      ],
    },
    [new TSConfigReader()],
  );

  if (logger.hasErrors()) {
    return { errors: logger.errors, pages: new Map() };
  }

  const project = await app.convert();

  if (project === undefined) {
    throw new Error(`TypeDoc could not convert the fixture: ${logger.errors.join('\n')}`);
  }

  const out = await mkdtemp(join(tmpdir(), 'typedoc-plugin-deacon-'));

  try {
    await app.generateDocs(project, out);
    const files = await readdir(out, { recursive: true });
    const pages = new Map<string, string>();

    for (const file of files.filter((name) => name.endsWith('.html')).sort()) {
      pages.set(file.replaceAll('\\', '/'), await readFile(join(out, file), 'utf8'));
    }

    return { errors: logger.errors, pages };
  } finally {
    await rm(out, { recursive: true, force: true });
  }
}

function head(page: string): string {
  return /<head>([\s\S]*?)<\/head>/.exec(page)?.[1] ?? '';
}

/** The loader tags in a page's head, exactly as TypeDoc wrote them. */
export function loaderTagsInHead(page: string): string[] {
  return head(page).match(LOADER_TAG) ?? [];
}

/** The attributes of each loader tag in a page's head, as a browser reads them. */
export function loaderAttributesInHead(page: string): Record<string, string>[] {
  const { document } = new JSDOM(page).window;

  return [
    ...document.head.querySelectorAll<HTMLScriptElement>(
      'script[src="https://heydeacon.com/widget/v1/loader.js"]',
    ),
  ].map((script) =>
    Object.fromEntries([...script.attributes].map(({ name, value }) => [name, value])),
  );
}
