// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let statusBarItem: vscode.StatusBarItem;
let versionCheckInterval: NodeJS.Timeout;  // 改用 Timeout 类型

export async function activate(context: vscode.ExtensionContext) {
	try {
		// 创建状态栏项，设置高优先级使其更靠近左侧
		statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
		statusBarItem.command = 'node-version.showNodeVersion';
		// 设置背景色使其更加醒目
		statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
		context.subscriptions.push(statusBarItem);

		// 注册命令
		let disposable = vscode.commands.registerCommand('node-version.showNodeVersion', async () => {
			// 点击时刷新版本并显示
			await updateNodeVersion();
			vscode.window.showInformationMessage(`当前 Node.js 版本: ${statusBarItem.text.replace('$(versions) Node: ', '')}`);
		});
		context.subscriptions.push(disposable);

		// 初始显示版本
		await updateNodeVersion();
		statusBarItem.show();

		// 每2秒检查一次版本
		versionCheckInterval = setInterval(async () => {
			await updateNodeVersion();
		}, 2000);

		console.log('Node版本插件已激活');
	} catch (error) {
		console.error('激活插件时出错:', error);
	}
}

async function updateNodeVersion() {
	try {
		const { stdout } = await execAsync('node --version');
		const version = stdout.trim();
		// 使用更醒目的格式
		statusBarItem.text = `$(versions) Node: ${version}`;
		statusBarItem.tooltip = `Node.js 版本: ${version}`;
	} catch (error) {
		statusBarItem.text = '$(error) Node: 未知';
		statusBarItem.tooltip = '无法获取 Node.js 版本';
	}
}

export function deactivate() {
	// 清理资源
	if (statusBarItem) {
		statusBarItem.dispose();
	}
	// 清理定时器
	if (versionCheckInterval) {
		clearInterval(versionCheckInterval);
	}
}
