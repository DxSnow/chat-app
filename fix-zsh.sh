#!/bin/bash
# 修复 zsh 权限问题

echo "正在修复 zsh 权限问题..."

# 修复不安全的目录
compaudit | xargs chmod g-w

# 修复常见的目录
chmod -R 755 /usr/local/share/zsh 2>/dev/null || true
chmod -R 755 /usr/local/share/zsh/site-functions 2>/dev/null || true

# 清除缓存
rm -f ~/.zcompdump*

# 重新初始化
autoload -U compinit && compinit

echo "✅ 修复完成!"
echo ""
echo "现在运行: source ~/.zshrc"
