import { join, resolve } from 'path';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { DependencyMap, PackageJSON } from './package-json';
import { omit } from 'lodash';
import { promisify } from 'util';
import { exec as _exec } from 'child_process';
import { ncp } from 'ncp';
import * as _rimraf from 'rimraf';

const exec = promisify(_exec);
const copy = promisify(ncp);
const rimraf = promisify(_rimraf);

const packageJSONArg: string = process.argv[2] || 'package.json';
const depArg: string | null = process.argv[3] || null;
const packageJSONPath: string = resolve(packageJSONArg);
const rootPath: string = packageJSONPath.replace('/package.json', '');

if (!depArg) {
  throw new Error('Please add a dependency');
}

const copyDestinationPath = join(rootPath, depArg.split('/')[0]);
const depPath: string = join(rootPath, 'node_modules', ...depArg.split('/'));

const packageJSONPojo: PackageJSON  = JSON.parse(readFileSync(packageJSONPath).toString('utf-8'));

let existsWhere: 'dependencies' | 'devDependencies' | null;

if (packageJSONPojo.dependencies && Object.keys(packageJSONPojo.dependencies).includes(depArg)) {
  existsWhere = 'dependencies';
} else if (packageJSONPojo.devDependencies && Object.keys(packageJSONPojo.devDependencies).includes(depArg)) {
  existsWhere = 'devDependencies';
} else {
  existsWhere = null;
}

if (!existsWhere) {
  throw new Error('Dependency not found in package-json');
}

const deps: DependencyMap | null = packageJSONPojo[existsWhere] || null;

if (!deps) {
  throw new Error('Dependency not found in package-json');
}

const tempPackageJSONPojo: PackageJSON = {
  ...packageJSONPojo,
  [existsWhere]: omit(deps, depArg)
};

(async () => {
  mkdirSync(copyDestinationPath);
  await copy(depPath, join(rootPath, ...depArg.split('/'))).catch(Promise.resolve);
  writeFileSync(packageJSONPath, JSON.stringify(tempPackageJSONPojo, null, 2));
  await exec(`cd ${rootPath} && yarn`);
  writeFileSync(packageJSONPath, JSON.stringify(packageJSONPojo, null, 2));
  await exec('git checkout yarn.lock -f');
  await copy(copyDestinationPath, join(rootPath,'node_modules')).catch(Promise.resolve);
  await rimraf(copyDestinationPath).catch(Promise.resolve);
})();
