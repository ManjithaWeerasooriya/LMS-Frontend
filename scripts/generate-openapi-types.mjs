import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const inputPath = path.join(root, 'docs/api/swagger.json');
const typesOutputPath = path.join(root, 'src/generated/api-types.ts');
const pathsOutputPath = path.join(root, 'src/generated/api-paths.ts');

const swagger = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const schemas = swagger.components?.schemas ?? {};
const paths = swagger.paths ?? {};

const indent = (level) => '  '.repeat(level);
const refName = (ref) => ref.split('/').at(-1);

const renderPrimitive = (schema) => {
  if (!schema || typeof schema !== 'object') return 'unknown';
  if (schema.$ref) return refName(schema.$ref);
  if (schema.enum) return schema.enum.map((value) => JSON.stringify(value)).join(' | ');

  if (schema.type === 'array') {
    return `Array<${renderType(schema.items)}>`;
  }

  if (schema.type === 'object') {
    const hasProps = schema.properties && Object.keys(schema.properties).length > 0;
    const additional = schema.additionalProperties;

    if (!hasProps && additional && additional !== false) {
      return `Record<string, ${renderType(additional)}>`;
    }

    const required = new Set(schema.required ?? []);
    const lines = ['{'];

    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      const optional = required.has(key) ? '' : '?';
      lines.push(`${indent(1)}${JSON.stringify(key)}${optional}: ${renderType(value)};`);
    }

    if (additional && additional !== false) {
      lines.push(`${indent(1)}[key: string]: ${renderType(additional)};`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'string') return 'string';
  return 'unknown';
};

const renderType = (schema) => {
  const base = renderPrimitive(schema);
  return schema?.nullable ? `${base} | null` : base;
};

const entries = Object.entries(schemas).sort(([a], [b]) => a.localeCompare(b));
const body = entries
  .map(([name, schema]) => `export type ${name} = ${renderType(schema)};\n`)
  .join('\n');

const header = `/* tslint:disable */\n/**\n * This file is auto-generated from docs/api/swagger.json.\n * Do not edit manually. Run \`npm run generate:api-types\` instead.\n */\n\n`;

const pathEntries = Object.keys(paths).sort((left, right) => left.localeCompare(right));
const renderedPaths = pathEntries
  .map((pathKey) => `  ${JSON.stringify(pathKey)}: ${JSON.stringify(pathKey)},`)
  .join('\n');
const pathHelpers = `export const apiPaths = {\n${renderedPaths}\n} as const;\n\nexport type ApiPathKey = keyof typeof apiPaths;\n\nexport const resolveApiPath = <T extends ApiPathKey>(path: T): T => apiPaths[path] as unknown as T;\n\nexport const buildApiPath = <T extends ApiPathKey>(\n  template: T,\n  params: Record<string, string | number>,\n): string => {\n  let resolved = apiPaths[template] as string;\n\n  for (const [key, value] of Object.entries(params)) {\n    resolved = resolved.replace(new RegExp(\`\\\\{\${key}\\\\}\`, 'g'), encodeURIComponent(String(value)));\n  }\n\n  if (/\\{[^}]+\\}/.test(resolved)) {\n    throw new Error(\`Missing path params for \${template}: \${resolved}\`);\n  }\n\n  return resolved;\n};\n`;

await fs.mkdir(path.dirname(typesOutputPath), { recursive: true });
await fs.writeFile(typesOutputPath, `${header}${body}`);
await fs.writeFile(pathsOutputPath, `${header}${pathHelpers}`);

console.log(`Generated ${path.relative(root, typesOutputPath)}`);
console.log(`Generated ${path.relative(root, pathsOutputPath)}`);
