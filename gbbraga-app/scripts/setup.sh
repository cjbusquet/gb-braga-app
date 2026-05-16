#!/bin/bash
# GB Braga — Script de Setup
set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
echo -e "${RED}  GRACIE BARRA BRAGA — Sistema de Gestão v1.0${NC}\n"
command -v node &>/dev/null || { echo -e "${RED}❌ Instala Node.js 18+ em nodejs.org${NC}"; exit 1; }
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
npm install && echo -e "${GREEN}✅ Dependências instaladas${NC}"
[ ! -f ".env.local" ] && cp .env.example .env.local && echo -e "${YELLOW}⚠  Edita .env.local com as tuas chaves${NC}"
npm run typecheck 2>/dev/null && echo -e "${GREEN}✅ TypeScript OK${NC}" || echo -e "${YELLOW}⚠  Ver avisos TypeScript${NC}"
echo -e "\n${GREEN}Próximos passos:${NC}"
echo "  1. Editar .env.local (Supabase + Stripe + TOConline)"
echo "  2. Executar supabase/schema.sql no Supabase SQL Editor"
echo "  3. npm run dev  →  http://localhost:5173"
echo "  4. npm run build  →  pasta dist/"
echo "  5. git push  →  deploy automático no Vercel"
echo -e "\n${RED}  OSS! 🥋${NC}"
