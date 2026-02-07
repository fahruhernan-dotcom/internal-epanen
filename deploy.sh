#!/bin/bash

# Script Deploy Otomatis untuk Internal System (VPS)
# Pastikan sudah setting chmod +x deploy.sh

echo "🚀 Memulai Deployment..."

# 1. Pindah ke folder project
cd /var/www/internal-system || exit

# 2. Tarik update terbaru dari GitHub
echo "📥 Menarik kode terbaru dari GitHub..."
git pull origin main

# 3. Masuk ke Frontend & Build Ulang
echo "🏗️  Build ulang Frontend..."
cd frontend
npm install
npm run build

# 4. Reload Nginx (Opsional, jika ada perubahan config)
# sudo systemctl reload nginx

echo "✅ DEPLOY SELESAI! Website sudah terupdate."
