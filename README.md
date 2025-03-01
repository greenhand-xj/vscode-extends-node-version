# Node Version

一个简单的 VS Code 扩展，用于显示和管理 Node.js 版本。

## 功能

- 在状态栏实时显示当前 Node.js 和 NPM 版本
- 支持使用 NVM 切换不同的 Node.js 版本
- 支持安装新的 Node.js 版本
- 自动检测 NVM 环境并提供相应功能

## 要求

- 需要安装 [Node.js](https://nodejs.org/)
- 推荐安装 [NVM (Node Version Manager)](https://github.com/nvm-sh/nvm) 以使用版本切换功能

## 使用方法

### 状态栏显示

插件激活后，会在 VS Code 的状态栏显示当前使用的 Node.js 和 NPM 版本。

- 黄色警告图标： Node.js 版本

### 命令

插件提供以下命令（可通过命令面板 `Ctrl+Shift+P` 或 `Cmd+Shift+P` 访问）：

- `Show Node Version`：显示当前 Node.js 和 NPM 版本信息
- `Switch Node Version`：切换到其他已安装的 Node.js 版本（需要 NVM）
- `Install New Node Version`：安装新的 Node.js 版本（需要 NVM）

## 扩展设置

暂无配置选项。

## 已知问题

- 在某些环境下可能需要重启 VS Code 才能正确识别 NVM 环境变量

## 发布说明

### 0.0.1

- 初始版本
- 支持显示 Node.js 和 NPM 版本
- 支持 NVM 版本切换和安装

## 开发

### 项目结构

node-version/
├── src/
│ ├── commands/ # 命令实现
│ ├── test/ # 测试文件
│ ├── extension.ts # 扩展入口
│ ├── utils.ts # 工具函数
│ └── version.ts # 版本信息处理
├── package.json # 扩展配置
└── README.md # 文档

### 构建和调试

1. 克隆仓库
2. 运行 `npm install` 安装依赖
3. 在 VS Code 中打开项目
4. 按 F5 启动调试

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT](LICENSE)
