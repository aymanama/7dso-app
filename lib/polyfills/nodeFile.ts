import { File as NodeFile } from 'node:buffer';

if (typeof globalThis.File === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).File = NodeFile;
}
