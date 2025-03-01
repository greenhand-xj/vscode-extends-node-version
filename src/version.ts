import * as vscode from 'vscode';
import { execAsync, checkNvmHasSelected } from './utils';
import { globalState } from './extension';

// 获取 Node 和 NPM 版本信息
export async function getVersionInfo() {
  const info = {
    node: '',
    npm: ''
  };

  try {
    // 获取 Node 版本
    const { stdout: nodeVersion } = await execAsync('node --version');
    info.node = nodeVersion.trim();

    // 获取 NPM 版本
    const { stdout: npmVersion } = await execAsync('npm --version');
    info.npm = npmVersion.trim();

    return info;
  } catch (error: any) {
    vscode.window.showErrorMessage('获取版本信息出错:', error.message);
    return info;
  }
}

// 更新状态栏显示的版本信息
export async function updateNodeVersion() {
  const { hasNvm, statusBarItem } = globalState
  if (hasNvm) {
    globalState.hasSelectedVersion = await checkNvmHasSelected();
    if (!globalState.hasSelectedVersion) {
      statusBarItem!.text = '$(warning) Node: 未指定版本';
      statusBarItem!.tooltip = '请点击选择要使用的 Node 版本';
      return;
    }
  }

  try {
    const info = await getVersionInfo();
    statusBarItem!.text = `$(versions) Node: ${info.node} | NPM: ${info.npm}`;
    statusBarItem!.tooltip =
      `Node.js 版本: ${info.node}\n` +
      `NPM 版本: ${info.npm}`;

  } catch (error: any) {
    console.error('获取版本信息出错:', error);

    let errorMessage = '未知错误';
    if (error.code === 'ENOENT') {
      errorMessage = '找不到node/npm命令，请确保Node.js已安装且在环境变量中';
    } else if (error.message) {
      errorMessage = error.message;
    }

    statusBarItem!.text = '$(error) Node/NPM: 错误';
    statusBarItem!.tooltip = `无法获取版本信息: ${errorMessage}`;

    vscode.window.showErrorMessage(`版本信息检测失败: ${errorMessage}`);
  }
} 