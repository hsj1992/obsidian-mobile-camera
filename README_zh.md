# Mobile Camera & QR Scanner Plugin for Obsidian

[English Documentation](README.md)

Obsidian 插件，专为移动设备设计，提供相机拍照和二维码识别功能。

> **📱 仅限移动端**：本插件专为移动设备（Android）设计。在桌面端会静默加载，不会报错或弹出通知，但所有功能均被禁用。iOS 支持尚未实现。

## 功能

- 📷 **拍照**：使用后置相机拍照并插入笔记
- 🔍 **拍摄二维码**：拍摄二维码照片并将识别内容插入笔记
- 📁 **灵活存储**：支持自定义保存路径模板
- ✏️ **文件命名**：可选的文件重命名提示和自定义文件名模板

## 操作演示

<!-- 在此添加截图/GIF/视频以展示插件功能 -->

## 安装

### 方法 1：从 Release 下载（推荐）

1. 访问 [Releases](https://github.com/hsj1992/obsidian-mobile-camera/releases) 页面
2. 下载最新版本的文件（`main.js`、`manifest.json`，如有 `styles.css` 也一并下载）
3. 在你的 vault 的 `.obsidian/plugins/` 目录下创建名为 `mobile-camera-qr-plugin` 的文件夹
4. 将下载的文件复制到 `mobile-camera-qr-plugin` 文件夹中
5. 重新加载 Obsidian 并在 设置 → 第三方插件 中启用该插件

### 方法 2：手动构建

1. 下载或克隆此仓库
2. 运行 `npm install` 安装依赖
3. 运行 `npm run build` 构建插件
4. 将 `main.js` 和 `manifest.json` 复制到你的 vault 的 `.obsidian/plugins/mobile-camera-qr-plugin/` 目录
5. 在 Obsidian 设置中启用插件

### 方法 3：开发模式

1. 克隆此仓库到你的 vault 的 `.obsidian/plugins/` 目录
2. 运行 `npm install`
3. 运行 `npm run dev` 启动开发模式（自动监听文件变化）
4. 在 Obsidian 设置中启用插件

## 使用方法

插件提供三个命令：

1. **Camera: Main Menu** - 打开主菜单，选择拍照或拍摄二维码
2. **Camera: Take Photo** - 直接进入拍照模式
3. **Camera: Capture QR Code** - 直接拍摄照片识别二维码

### 快速开始

1. 打开一个笔记
2. 通过命令面板搜索上述命令，或在移动端工具栏固定命令快捷访问
3. 选择拍照或拍摄二维码
4. 拍照后图片会自动保存并插入笔记
5. 拍摄二维码照片后，识别的内容会自动插入笔记

### 使用场景示例

#### 📝 日记配图

**场景**：快速为每日笔记添加照片

1. 打开今天的日记
2. 点击相机命令（固定到工具栏可快速访问）
3. 拍摄美食、工作环境或任何值得记录的内容
4. 照片自动以 `![[image.jpg]]` 格式插入

**提示**：在设置中启用"直接导入"可获得最快的工作流程

#### 📦 产品文档

**场景**：用二维码和照片记录产品信息

1. 为产品创建笔记
2. 使用"拍摄二维码"拍照并识别产品信息
3. 使用"拍照"捕获产品图片
4. 所有内容自动插入笔记

**提示**：关闭"直接导入"可以用描述性名称重命名照片

#### 🎫 活动收集

**场景**：收集门票、名片或海报上的二维码

1. 创建收集笔记（如"2024会议"）
2. 重复使用"拍摄二维码"命令
3. 每个识别的二维码内容都会作为文本插入
4. 在拍摄之间添加自己的笔记

#### 📚 研究笔记

**场景**：捕获书页、白板或文档

1. 打开研究笔记
2. 使用"拍照"捕获内容
3. 照片默认保存在 `{notepath}/image`
4. 通过自定义保存文件夹路径进行组织

**提示**：使用 `{notepath}/attachments` 可按笔记位置组织照片

---

更多高级用法，请参阅[高级指南](docs/advanced.md)。

## 配置选项

在插件设置中可以配置：

- **Save folder**：照片保存路径模板
  - 默认：`{notepath}/image`
  - `{notepath}` 会被替换为当前笔记所在目录
  - 示例：`Camera` 或 `{notepath}/attachments`

- **Auto-save photo**：是否自动保存照片
  - 开启：拍照后直接保存
  - 关闭：拍照后提示输入文件名

- **Photo filename template**：自定义自动生成的文件名格式
  - 默认：`{YYYY}{MM}{DD}-{HH}{mm}{ss}{SSS}-{random}`
  - 占位符：`{YYYY}` `{MM}` `{DD}` `{HH}` `{mm}` `{ss}` `{SSS}` `{random}`

- **Copy QR result to clipboard**：复制识别的二维码内容到剪贴板
  - 默认：关闭

## 隐私与权限

### 权限说明

- **相机权限**：本插件需要访问设备相机以拍照和拍摄二维码
- 首次使用时，Android 会请求相机权限，请允许以使用此插件

### 隐私政策

本插件高度重视您的隐私：

- ✅ **本地存储**：所有照片和识别的二维码内容仅保存在您的本地 Obsidian vault 中
- ✅ **无网络活动**：本插件不会向任何外部服务器发送数据
- ✅ **无数据收集**：不收集任何使用数据或分析信息
- ✅ **无遥测**：不包含任何追踪或统计代码
- ✅ **开源透明**：所有代码公开可审查

您的照片和数据完全由您掌控，永远不会离开您的设备。

## 技术栈

- TypeScript
- Obsidian API
- jsQR - 二维码解码库
- esbuild - 快速构建工具
- Web APIs (File Input with camera capture)

## 开发

```bash
# 安装依赖
npm install

# 开发模式（自动监听文件变化）
npm run dev

# 生产构建
npm run build
```

## 构建说明

本项目使用 esbuild 作为构建工具，相比传统的 Rollup 或 Webpack 更快更轻量。

- 开发模式会生成带 sourcemap 的代码，方便调试
- 生产模式会进行代码压缩和 tree-shaking 优化

## 二维码识别

插件使用双重策略从照片中识别二维码：

1. 优先使用原生 `BarcodeDetector` API（如果浏览器支持）
2. 回退到 jsQR 库进行多尺度图像处理

这确保了在不同设备上的最佳兼容性和性能。

## License

MIT
