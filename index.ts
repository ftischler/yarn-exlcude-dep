import { join, resolve } from 'path';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { DependencyMap, PackageJSON } from './package-json';
import { omit } from 'lodash';
import { spawnSync, SpawnSyncReturns } from 'child_process';

const fileArg: string = process.argv[2] || 'package.json';
const depArg: string | null = process.argv[3] || null;
const filePath: string = resolve(fileArg);

if (!depArg) {
  throw new Error('Please add a dependency');
}

const pathToDep: string = join('node_modules', filePath);
const packageJSONPojo: PackageJSON  = JSON.parse(readFileSync(filePath).toString('utf-8'));

let existsWhere: 'dependencies' | 'devDependencies' | null;

if (packageJSONPojo.dependencies && Object.values(packageJSONPojo.dependencies).includes(depArg)) {
  existsWhere = 'dependencies';
} else if (packageJSONPojo.devDependencies && Object.values(packageJSONPojo.devDependencies).includes(depArg)) {
  existsWhere = 'devDependencies';
} else {
  existsWhere = null;
}

if (!existsWhere) {
  throw new Error('Dependency not found in package-json');
}

const dir: Buffer[] = readdirSync(pathToDep, {encoding: 'buffer'});
const deps: DependencyMap | null = packageJSONPojo[existsWhere] || null;

if (!deps) {
  throw new Error('Dependency not found in package-json');
}

const tempPackageJSONPojo: PackageJSON = {
  ...packageJSONPojo,
  [existsWhere]: omit(deps, depArg)
};

writeFileSync(filePath, tempPackageJSONPojo);
const yarnCP: SpawnSyncReturns<Buffer> = spawnSync(`cd ${filePath.replace('/package.json', '')} && yarn`);

if (!yarnCP.error) {
  writeFileSync(pathToDep, dir);
  writeFileSync(filePath, packageJSONPojo);
  const hasError: boolean = !!spawnSync('git checkout yarn.lock -f').error;
  process.exit(hasError ? 1 : 0);
} else {
  process.exit(1);
}
