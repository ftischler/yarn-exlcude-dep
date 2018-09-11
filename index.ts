import { resolve } from 'path';

const fileArg: string = process.argv[2] || 'package.json';
const depArg: string | null = process.argv[3] || null;
const filePath: string = resolve(fileArg);

console.log(filePath);