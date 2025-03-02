import * as vscode from 'vscode';
import { execAsync, sleep, checkNvm, checkNvmHasSelected } from '../utils';
import { getVersionInfo, updateNodeVersion } from '../version';

// 获取本地已安装的 Node 版本列表
export async function getLocalAvailableNodeVersions() {
  try {
    const { stdout } = await execAsync('nvm ls');

    return stdout.split('\n')
      .filter(line => line.trim() && /\d+\.\d+\.\d+/.test(line))  // 保留所有包含版本号的行
      .map(line => {
        // 提取版本号
        const version = line.match(/\d+\.\d+\.\d+/)?.[0] || '';
        return version;
      })
      .filter(item => item !== '');  // 过滤掉无效版本
  } catch (error: any) {
    vscode.window.showErrorMessage('获取本地Node版本列表失败:', error.message);
    return [];
  }
}

// 获取远程可用的 Node 版本列表
export async function getRemoteAvailableNodeVersions() {
  try {
    const { stdout } = await execAsync('nvm list available');
    const lines = stdout.split('\n');

    // 找到表头行
    const headerLine = lines.find(line => line.includes('CURRENT') && line.includes('LTS'));
    if (!headerLine) {
      return [];
    }

    // 解析表头，找到 CURRENT 和 LTS 列的位置
    const headers = headerLine.split('|').map(h => h.trim());
    const currentIndex = headers.indexOf('CURRENT');
    const ltsIndex = headers.indexOf('LTS');

    // 处理数据行
    return lines
      .filter(line => line.includes('|') && !line.includes('|-')) // 过滤掉分隔符行
      .map(line => {
        const columns = line.split('|').map(col => col.trim());
        const versions = [];

        // 处理 CURRENT 列的版本
        if (columns[currentIndex] && /^\d+\.\d+\.\d+$/.test(columns[currentIndex])) {
          versions.push({
            version: `v${columns[currentIndex]}`,
            type: 'CURRENT'
          });
        }

        // 处理 LTS 列的版本
        if (columns[ltsIndex] && /^\d+\.\d+\.\d+$/.test(columns[ltsIndex])) {
          versions.push({
            version: `v${columns[ltsIndex]}`,
            type: 'LTS'
          });
        }

        return versions;
      })
      .flat()
      .filter(item => item.version !== 'v'); // 过滤掉无效版本
  } catch (error: any) {
    vscode.window.showErrorMessage('获取Node版本列表失败:', error.message);
    return [];
  }
}

// 显示 Node 版本信息命令
export async function showNodeVersion() {
  await updateNodeVersion();
}

// 切换 Node 版本命令
export async function switchNodeVersion() {
  const hasNvm = await checkNvm();
  if (!hasNvm) {
    vscode.window.showErrorMessage('未检测到 NVM，请先安装 NVM 才能切换 Node 版本');
    return;
  }

  const versions = await getLocalAvailableNodeVersions();
  if (!versions.length) {
    vscode.window.showErrorMessage('未找到可用的 Node 版本');
    return;
  }

  const selected = await vscode.window.showQuickPick(
    versions,
    {
      placeHolder: '选择要切换的 Node 版本'
    }
  );

  if (selected) {
    try {
      await execAsync(`nvm use ${selected}`);
      await sleep(500);
      await updateNodeVersion();
      vscode.window.showInformationMessage(`已切换到 Node ${selected}`);
    } catch (error: any) {
      vscode.window.showErrorMessage('切换 Node 版本失败:', error.message);
    }
  }
}

// 安装新的 Node 版本命令
export async function installNodeVersion() {
  try {
    const versions = await getRemoteAvailableNodeVersions();

    const selected = await vscode.window.showQuickPick(
      versions.map(v => ({ label: v.version, description: v.type })),
      {
        placeHolder: '选择要安装的 Node 版本'
      }
    );

    if (selected) {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: `正在安装 Node ${selected.label}`,
        cancellable: false
      }, async () => {
        await execAsync(`nvm install ${selected.label.replace('v', '')}`);
        await sleep(500);
        await execAsync(`nvm use ${selected.label.replace('v', '')}`);
        await sleep(500);
        await updateNodeVersion();
      });

      vscode.window.showInformationMessage(`Node ${selected.label} 安装并切换完成`);
    }
  } catch (error: any) {
    vscode.window.showErrorMessage('安装 Node 版本失败:', error.message);
  }
} 