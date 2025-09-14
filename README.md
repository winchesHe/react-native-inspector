# react-native-components-inspector

一个用于 React Native/Expo 开发阶段的 Inspector 辅助工具：
- Babel 插件会在 development 环境为组件注入 `__inspectorSource` 属性，便于在调试器或自定义逻辑中定位到源码位置。
- Metro 中间件集成了打开编辑器的能力（基于 launch-editor），通过 Dev Server 请求快速在本地编辑器中打开对应文件。

https://github.com/user-attachments/assets/32b2c1e5-d798-4a72-b0c1-1c3cbd537131

## 使用

### babel.config.js

将插件按需注入，仅在 development 环境生效：

```js
module.exports = function (api) {
  const env = api.env();
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      env === 'development'
        ? [
          require.resolve('react-native-components-inspector/babel/injectInspectorSource'),
          { propName: '__inspectorSource' },
        ]
        : void 0,
    ].filter(Boolean),
  };
};
```

### metro.config.js

为 Metro Dev Server 增强中间件以支持在编辑器中打开文件：

```js
const { launchEditorMiddleware } = require('react-native-components-inspector/scripts/launchEditorMiddleware');

module.exports = (() => {
  // Attach custom middleware for opening files in editor
  config.server = {
    ...config.server,
    enhanceMiddleware: (middleware) => {
      const launchMw = launchEditorMiddleware();
      return (req, res, next) => launchMw(req, res, () => middleware(req, res, next));
    },
  };

  return config;
})();
```

> 提示：上述片段展示了核心接入点；请按你的项目实际导入/获取 `config` 与 `launchEditorMiddleware` 的方式完成接入。

### 根组件包裹 InspectorWrapper（App.tsx）

在应用入口处，用 `InspectorWrapper` 包裹你的根组件，建议仅在开发环境启用：

```tsx
import React from 'react';
import { InspectorWrapper } from 'react-native-components-inspector/src/components/InspectorWrapper';
import { Root } from './src/Root';

export default function App() {
  const Wrapper: React.ComponentType<any> = __DEV__ ? InspectorWrapper : React.Fragment;
  return (
    <Wrapper>
      <Root />
    </Wrapper>
  );
}
```

> 如果你的项目使用不同的入口（例如 index.js / index.tsx 或 Expo Router 的 app/_layout.tsx），请在相应的根布局处按同样方式包裹。
