/** Says hello to someone. */
export function greet(name: string): string {
  return `Hello, ${name}`;
}

/** A thing with a name. */
export class Thing {
  constructor(public readonly name: string) {}
}
