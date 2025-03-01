// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { sleep, execAsync, checkNvm, checkNvmHasSelected } from './utils';
import { updateNodeVersion } from './version';
import { showNodeVersion, switchNodeVersion, installNodeVersion } from './commands';

export const globalState = {
	statusBarItem: null as vscode.StatusBarItem | null,
	hasNvm: false,
	hasSelectedVersion: false
}
export let versionCheckInterval: NodeJS.Timeout;

export async function activate(context: vscode.ExtensionContext) {
	// 初始化全局状态
	globalState.hasNvm = await checkNvm();
	if (globalState.hasNvm) {
		globalState.hasSelectedVersion = await checkNvmHasSelected();
	}

	if (!globalState.hasNvm) {
		vscode.window.showInformationMessage('未检测到 NVM，建议安装 NVM 并指定 Node 版本');
	}

	try {
		// 创建状态栏项
		globalState.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
		globalState.statusBarItem.command = 'node-version.switchNodeVersion';
		globalState.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
		context.subscriptions.push(globalState.statusBarItem);

		// 注册命令
		context.subscriptions.push(
			vscode.commands.registerCommand('node-version.showNodeVersion', showNodeVersion),
			vscode.commands.registerCommand('node-version.switchNodeVersion', switchNodeVersion),
			vscode.commands.registerCommand('node-version.installNodeVersion', installNodeVersion)
		);

		// 初始显示版本
		await updateNodeVersion();
		globalState.statusBarItem.show();

		// 定时检查版本
		versionCheckInterval = setInterval(async () => {
			await updateNodeVersion();
		}, 3000);

		console.log('Node版本插件已激活');
	} catch (error: any) {
		vscode.window.showErrorMessage('激活插件时出错:', error.message);
	}
}

export function deactivate() {
	// 清理资源
	if ((global as any).statusBarItem) {
		(global as any).statusBarItem.dispose();
	}

	// 清理定时器
	if (versionCheckInterval) {
		clearInterval(versionCheckInterval);
	}
}
