import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('publicación estática', () => {
  it('carga los estilos desde HTML sin depender de un empaquetador', async () => {
    const [html, script] = await Promise.all([
      readFile('index.html', 'utf8'),
      readFile('src/main.js', 'utf8'),
    ]);

    assert.match(html, /<link rel="stylesheet" href="\.\/src\/styles\.css" \/>/);
    assert.match(html, /<script type="module" src="\.\/src\/main\.js"><\/script>/);
    assert.doesNotMatch(script, /import\s+['"]\.\/styles\.css['"]/);
    assert.match(script, /^import \{ analyze \} from '\.\/analysis\.js';/);
  });
});
