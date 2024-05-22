import fs from 'fs/promises';
import { dirname } from 'path';
import camelcase from 'camelcase';
import feather from 'feather-icons';

/**
 * Generates component code from icon data.
 * @param {{ name: string, contents: string, attrs: object[] }} icon - The icon data.
 * @param {string} format - The module format.
 * @returns {Promise<string>} The generated component code.
 */
async function genComp(icon, format = 'esm') {
  let code = await fs.readFile('./scripts/template.js', 'utf-8');
  code = code
    .replace('ATTRS', `...${JSON.stringify(icon.attrs).replace(/\"/g, `'`)}`)
    .replace('CONTENT', `'${icon.contents}'`);

  if (format === 'esm') {
    return code;
  }

  return code
    .replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+(['"])(.*?)\2/, (match, imports, quote, mod) => {
      let newImports = imports
        .split(',')
        .map((i) => i.trim().replace(/\s+as\s+/, ': '))
        .join(', ');

      return `const { ${newImports} } = require('${mod}')`;
    })
    .replace('export default', 'module.exports =');
}

/**
 * Retrieves all icons from the Feather icons library.
 * @returns {Promise<Array<{ name: string, contents: string, attrs: object[] }>>} An array of icon data.
 */
async function fetchIcons() {
  return Promise.all(
    Object.entries(feather.icons).map(async (icon) => ({
      name: `${camelcase(icon[1].name, { pascalCase: true })}Icon`,
      contents: icon[1].contents,
      attrs: icon[1].attrs
    }))
  );
}

/**
 * Write data to a specific file.
 * @param {string} filePath - The path to the file.
 * @param {string} data - The data to write.
 */
async function writeFile(filePath, data) {
  await fs.mkdir(dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, data, 'utf-8');
}

/**
 * Generates export statements for the icons.
 * @param {Array<{ name: string, contents: string, attrs: object[] }>} icons - The icon data.
 * @param {string} format - The module format.
 * @returns {string} The generated export statements.
 */
function genExportStmts(icons, format = 'esm') {
  return icons
    .map(({ name }) => {
      if (format === 'esm') {
        return `export { default as ${name} } from './${name}.js';`;
      }

      return `module.exports.${name} = require('./${name}.js');`;
    })
    .join('\n');
}

/**
 * @param {string} format - The module format.
 */
async function buildIcons(format = 'esm') {
  let buildDir = './dist';
  if (format === 'esm') {
    buildDir += '/esm';
  }

  let icons = await fetchIcons();

  await Promise.all(
    icons.map(async (icon) => {
      let data = await genComp(icon, format);

      return [writeFile(`${buildDir}/${icon.name}.js`, data)];
    })
  );

  await writeFile(`${buildDir}/index.js`, genExportStmts(icons, format));
}

async function main() {
  console.log('Building...');

  await Promise.all([buildIcons('esm'), buildIcons('cjs')]);

  console.log('Finished.');
}

main();
