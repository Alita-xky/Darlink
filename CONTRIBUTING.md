# 贡献指南

欢迎为 Darlink 项目做出贡献！无论是错误修复、新功能还是文档改进，我们都非常感谢您的帮助。

## 快速开始

### 1. Fork 和 Clone

```bash
# Fork 本仓库（在 GitHub 上点击 Fork 按钮）
git clone https://github.com/YOUR_USERNAME/darlink.git
cd darlink
```

### 2. 创建本地环境

```bash
conda create -n darlink-dev python=3.11 -y
conda activate darlink-dev
pip install -r backend/requirements.txt
pip install -r model_service/requirements.txt
```

### 3. 创建特性分支

```bash
git checkout -b feature/your-feature-name
# 或者修复 bug：
git checkout -b fix/bug-description
```

### 4. 进行修改和提交

```bash
# 修改文件...
git add .
git commit -m "type: 简洁的描述

更详细的说明（可选）
- 具体改动点 1
- 具体改动点 2
"
```

### 5. 推送和创建 Pull Request

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request，描述您的修改内容。

## 提交消息规范

请使用以下格式：

```
type(scope): subject

body

footer
```

### Type（必要）

- **feat**: 新功能
- **fix**: 错误修复
- **docs**: 文档更新
- **style**: 代码风格修改（格式、缺少分号等）
- **refactor**: 代码重构（既不修复错误也不添加功能）
- **perf**: 性能优化
- **test**: 添加或更新测试
- **ci**: CI/CD 配置修改
- **chore**: 其他不修改 src 或 test 的修改

### Scope（可选）

- backend
- frontend
- model_service
- database
- docs

### Subject（必要）

- 使用命令式语气（"add" 而不是 "added"）
- 不要大写首字母
- 不要以句号结尾
- 限制在 50 个字符以内

### 示例

```
feat(backend): 添加数据蒸馏 API 端点

- 实现 POST /data/distill/{persona_id}
- 添加对话特征提取算法
- 支持定期蒸馏任务

Closes #123
```

## 代码风格

### Python

- 遵循 PEP 8 规范
- 使用 4 个空格缩进
- 使用类型提示
- 添加 docstrings

```python
def extract_features(messages: list[str]) -> dict:
    """
    从消息列表中提取人物特征。
    
    Args:
        messages: 消息文本列表
        
    Returns:
        包含特征统计的字典
    """
    # 实现...
    pass
```

### 前端

- 使用 Prettier 格式化 HTML/CSS/JS
- 使用有意义的变量名
- 为复杂逻辑添加注释

## 测试

在提交 PR 前，请确保：

```bash
# 运行后端测试（如果有）
pytest backend/

# 运行本地烟雾测试
.\start-dev.ps1
# 手动测试主要流程
```

## 文档

如果您的修改涉及以下内容，请更新相应文档：

- API 改变 → 更新 README.md 或 TEAM_QUICK_START.md
- 新功能 → 更新相关的 SPEC 文档
- 数据库改变 → 更新 DATA_PARSING.md

## 问题和讨论

- **报告 Bug**：使用 GitHub Issues 模板
- **功能建议**：在 Issues 中标记为 `enhancement`
- **讨论**：使用 GitHub Discussions

## 代码审查

所有 PR 都需要至少一个维护者的批准。在审查过程中：

- 保持开放和建设性的态度
- 解释您的决定和推理
- 尊重维护者和贡献者的意见

## 许可证

通过贡献，您同意您的贡献将在 MIT 许可证下进行许可。

---

感谢您的贡献！🎉
