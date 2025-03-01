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

export async function checkNvmHasSelected() {
  try {
    const { stdout } = await execAsync('nvm current');
    // 如果输出包含 'none' 或 'system' 或为空，说明没有指定版本
    return !stdout.includes('none') && !stdout.includes('system') && stdout.trim() !== '' && !stdout.includes('No current version');
  } catch {
    return false;
  }
}
