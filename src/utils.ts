import { exec } from 'child_process';
import { promisify } from 'util';

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const execAsync = promisify(exec);


export async function checkNvm() {
  try {
    await execAsync('nvm version');
    return true;
  } catch {
    return false;
  }
}