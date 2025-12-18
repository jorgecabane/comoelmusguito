#!/bin/bash

# Script para facilitar testing de webhook de Flow desde localhost usando ngrok
# Uso: ./scripts/test-webhook-local.sh

echo "🧪 Testing Webhook de Flow desde Localhost"
echo "=========================================="
echo ""

# Verificar que ngrok está instalado
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok no está instalado."
    echo ""
    echo "Instalar con:"
    echo "  brew install ngrok"
    echo ""
    echo "O descargar desde: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok encontrado"
echo ""

# Verificar que el servidor Next.js está corriendo
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  No se detecta servidor en localhost:3000"
    echo ""
    echo "Por favor, inicia tu servidor Next.js en otra terminal:"
    echo "  npm run dev"
    echo ""
    read -p "Presiona Enter cuando el servidor esté corriendo..."
fi

echo "✅ Servidor detectado en localhost:3000"
echo ""
echo "📋 Pasos siguientes:"
echo "1. ngrok iniciará y te dará una URL pública (ej: https://abc123.ngrok.io)"
echo "2. Copia esa URL"
echo "3. Actualiza NEXT_PUBLIC_SITE_URL en .env.local con esa URL"
echo "4. Reinicia tu servidor Next.js (Ctrl+C y npm run dev)"
echo "5. Usa esa URL para probar el checkout"
echo ""
echo "⚠️  IMPORTANTE: Usa las credenciales de Flow SANDBOX, no producción"
echo ""
read -p "Presiona Enter para iniciar ngrok..."

echo ""
echo "🚀 Iniciando ngrok..."
echo "   URL pública aparecerá abajo"
echo "   Presiona Ctrl+C para detener"
echo ""

ngrok http 3000
