#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
# setup-hooks.sh
# Jalankan sekali setelah clone: bash scripts/setup-hooks.sh
# Mengkonfigurasi git agar menggunakan folder hooks/ di repo ini.
# ─────────────────────────────────────────────────────────────────────

set -e

HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/hooks"

# Pastikan dalam git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "[setup-hooks] ERROR: Bukan git repository. Jalankan 'git init' dulu."
  exit 1
fi

# Set hooksPath ke folder hooks/ di root project
git config core.hooksPath hooks

# Pastikan semua hook executable
chmod +x "$HOOKS_DIR"/*

echo ""
echo "✅ Git hooks berhasil dikonfigurasi!"
echo "   hooksPath → hooks/"
echo "   Hook aktif:"
ls -1 "$HOOKS_DIR/"
echo ""
echo "   Setiap 'git commit' akan otomatis bump patch version di app/constants/version.ts"
