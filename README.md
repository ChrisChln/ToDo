# TO DO LIST / Calendar

一个集待办清单与日历为一体的 Web 应用，支持主题色、分类列表、桌面快捷方式与日历休息日标记。

## 功能

- 周视图日历与事件管理
- 任务分类与拖拽排序
- 可自定义桌面图标（支持上传图片）
- 主题色与深浅色模式，主题色全局生效
- 工具页若干实用工具（可折叠）
- 本地存储持久化，可接入后台同步

## 技术栈

- React + Vite
- Tailwind CSS
- Redux Toolkit
- date-fns
- @react-oauth/google（可选）

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 启动开发服务器

```bash
npm run dev
```

3. 生产构建

```bash
npm run build
```

## 可选配置

- Google OAuth：参见 `GOOGLE_OAUTH_SETUP.md`
- 主题色：在“工具”页设置，值会保存到本地存储并在全局生效

## 目录结构（简要）

```
src/
  components/        主要页面与组件
  store/             Redux store 与 slices
  utils/             工具与本地存储
  main.jsx           应用入口
```

## 许可

MIT
