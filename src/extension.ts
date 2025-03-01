// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

let statusBarItem: vscode.StatusBarItem;
let versionCheckInterval: NodeJS.Timeout;  // 改用 Timeout 类型

async function getVersionInfo() {
	const info = {
		node: '',
		npm: '',
		globalPackages: ''
	};

	try {
		// 获取 Node 版本
		const { stdout: nodeVersion } = await execAsync('node --version');
		info.node = nodeVersion.trim();

		// 获取 NPM 版本
		const { stdout: npmVersion } = await execAsync('npm --version');
		info.npm = npmVersion.trim();

		// 获取全局包列表
		const { stdout: npmList } = await execAsync('npm list -g --depth=0');
		info.globalPackages = npmList;

		return info;
	} catch (error: any) {
		vscode.window.showErrorMessage('获取版本信息出错:', error.message);
		return info
	}
}

async function checkNvm() {
	try {
		await execAsync('nvm version');
		return true;
	} catch {
		return false;
	}
}

async function getAvailableNodeVersions() {
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

async function switchNodeVersion() {
	const hasNvm = await checkNvm();
	if (!hasNvm) {
		vscode.window.showErrorMessage('未检测到 NVM，请先安装 NVM 才能切换 Node 版本');
		return;
	}

	const versions = await getAvailableNodeVersions();
	console.log(versions);
	if (!versions.length) {
		vscode.window.showErrorMessage('未找到可用的 Node 版本');
		return;
	}

	const selected = await vscode.window.showQuickPick(
		versions.map(v => ({
			label: v.version,
			description: v.type,  // 在选项右侧显示版本类型
			detail: v.type === 'LTS' ? '长期支持版本' : '当前最新版本'
		})),
		{
			placeHolder: '选择要切换的 Node 版本'
		}
	);

	if (selected) {
		try {
			await execAsync(`nvm use ${selected.label}`);
			await updateNodeVersion();
			vscode.window.showInformationMessage(`已切换到 Node ${selected.label} (${selected.description})`);
		} catch (error: any) {
			vscode.window.showErrorMessage('切换 Node 版本失败:', error.message);
		}
	}
}

export async function activate(context: vscode.ExtensionContext) {
	try {
		// 创建状态栏项，设置高优先级使其更靠近左侧
		statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000);
		statusBarItem.command = 'node-version.switchVersion';
		// 设置背景色使其更加醒目
		statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
		context.subscriptions.push(statusBarItem);

		// 注册命令
		let disposable = vscode.commands.registerCommand('node-version.showNodeVersion', async () => {
			await updateNodeVersion();
			// const info = statusBarItem.tooltip;
			// if (info) {
			// 	vscode.window.showInformationMessage(info.toString(), { modal: true });
			// }
		});
		context.subscriptions.push(disposable);

		// 添加切换版本的命令
		let switchVersionCommand = vscode.commands.registerCommand('node-version.switchVersion', switchNodeVersion);
		context.subscriptions.push(switchVersionCommand);

		// 初始显示版本
		await updateNodeVersion();
		statusBarItem.show();

		// 每2秒检查一次版本
		versionCheckInterval = setInterval(async () => {
			await updateNodeVersion();
		}, 3000);

		console.log('Node版本插件已激活');
	} catch (error: any) {
		vscode.window.showErrorMessage('激活插件时出错:', error.message);
	}
}

async function updateNodeVersion() {
	try {
		const info = await getVersionInfo();

		statusBarItem.text = `$(versions) Node: ${info.node} | NPM: ${info.npm}`;
		statusBarItem.tooltip =
			`Node.js 版本: ${info.node}\n` +
			`NPM 版本: ${info.npm}\n\n` +
			`全局包列表:\n${info.globalPackages}`;

	} catch (error: any) {
		console.error('获取版本信息出错:', error);

		let errorMessage = '未知错误';
		if (error.code === 'ENOENT') {
			errorMessage = '找不到node/npm命令，请确保Node.js已安装且在环境变量中';
		} else if (error.message) {
			errorMessage = error.message;
		}

		statusBarItem.text = '$(error) Node/NPM: 错误';
		statusBarItem.tooltip = `无法获取版本信息: ${errorMessage}`;

		vscode.window.showErrorMessage(`版本信息检测失败: ${errorMessage}`);
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
