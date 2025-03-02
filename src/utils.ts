import { exec, ExecOptions } from 'child_process';

// 自定义 exec 函数，添加 Windows 环境支持
export function execAsync(command: string, options: ExecOptions = {}) {
  // 合并环境变量，确保包含系统环境变量
  const env = Object.assign({}, process.env, options.env || {});

  // 在 Windows 上，使用 cmd.exe 执行命令
  const finalCommand = isWindows ? `cmd.exe /c ${command}` : command;

  // 设置 shell 选项
  const finalOptions: ExecOptions = {
    ...options,
    env,
    shell: isWindows ? 'cmd.exe' : options.shell
  };

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    exec(finalCommand, finalOptions, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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

export const isWindows = process.platform === 'win32';
export const isLinux = process.platform === 'linux';
export const isMac = process.platform === 'darwin';

