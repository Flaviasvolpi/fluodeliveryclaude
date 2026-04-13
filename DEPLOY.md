# FluoDelivery — Guia de Publicação em Produção

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   Servidor                       │
│                                                  │
│  ┌──────────┐    ┌──────────┐    ┌────────────┐ │
│  │  Nginx   │───▶│  NestJS  │───▶│ PostgreSQL │ │
│  │ (web:80) │    │ (api:3000│    │ (:5432)    │ │
│  └──────────┘    └──────────┘    └────────────┘ │
│   Frontend +      Backend API     Banco de dados │
│   Proxy reverso                                  │
└─────────────────────────────────────────────────┘
```

O sistema roda em 3 containers Docker:

| Container | Tecnologia | Porta | Função |
|-----------|------------|-------|--------|
| `web` | Nginx + React | 80 | Serve o frontend e faz proxy para a API |
| `api` | Node.js + NestJS | 3000 (interna) | API REST do backend |
| `postgres` | PostgreSQL 16 | 5432 (interna) | Banco de dados |

Um 4o container (`seed`) roda uma única vez na primeira subida para criar as tabelas e dados iniciais.

---

## Estrutura de Arquivos

```
fluodeliveryclaude/
├── docker-compose.yml        # Orquestra todos os containers
├── frontend.Dockerfile       # Build do frontend (React → Nginx)
├── nginx.conf                # Configuração do Nginx (proxy + SPA)
├── .dockerignore              # Arquivos ignorados no build do frontend
├── .env.production           # Template de variáveis de ambiente
│
├── backend/
│   ├── Dockerfile            # Build do backend (NestJS → Node)
│   ├── .dockerignore          # Arquivos ignorados no build do backend
│   ├── prisma/
│   │   ├── schema.prisma     # Schema do banco de dados
│   │   └── seed.ts           # Script de dados iniciais
│   └── src/                  # Código fonte do backend
│
└── src/                      # Código fonte do frontend (React)
```

### O que cada arquivo faz

**`docker-compose.yml`**
Arquivo principal que define todos os serviços. Configura a rede entre containers, volumes persistentes para banco e uploads, e variáveis de ambiente.

**`frontend.Dockerfile`**
Build em 2 estágios:
1. Compila o React com Vite (gera arquivos estáticos em `/dist`)
2. Copia os arquivos para uma imagem Nginx leve

**`backend/Dockerfile`**
Build em 2 estágios:
1. Instala dependências, gera o Prisma Client, compila o NestJS
2. Copia apenas o necessário para uma imagem Node.js leve

**`nginx.conf`**
- Rota `/api/*` → encaminha para o container `api` na porta 3000
- Rota `/assets/*` → serve arquivos estáticos com cache de 1 ano
- Qualquer outra rota → serve `index.html` (SPA React Router)
- Compressão gzip ativada

**`.env.production`**
Template com as variáveis que precisam ser configuradas antes de subir.

---

## Pré-requisitos

- **Docker** e **Docker Compose** instalados no servidor
- Mínimo 1 GB de RAM disponível
- Portas 80 (HTTP) livres no servidor

### Verificar instalação

```bash
docker --version        # Docker 20+ recomendado
docker compose version  # Docker Compose v2+
```

---

## Passo a Passo — Primeira Publicação

### 1. Enviar o projeto para o servidor

Copie a pasta do projeto para o servidor via `git clone`, `scp`, ou qualquer método:

```bash
# Opção A: Git
git clone <url-do-repositorio> /opt/fluodelivery
cd /opt/fluodelivery

# Opção B: SCP (do seu PC para o servidor)
scp -r C:\Users\flavi\Projetos\fluodeliveryclaude usuario@servidor:/opt/fluodelivery
```

### 2. Configurar variáveis de ambiente

```bash
cd /opt/fluodelivery
cp .env.production .env
```

Edite o arquivo `.env` com valores seguros:

```bash
nano .env
```

```env
# Senha do banco de dados (escolha uma senha forte)
DB_PASSWORD=MinHaSenHaF0rte123!

# Chaves JWT (gere com o comando abaixo)
JWT_SECRET=cole-aqui-a-chave-gerada
JWT_REFRESH_SECRET=cole-aqui-outra-chave-gerada
```

Para gerar chaves seguras:

```bash
openssl rand -base64 48    # Execute 2 vezes, uma para cada chave
```

### 3. Subir os containers

```bash
docker compose up -d --build
```

Isso vai:
1. Baixar a imagem do PostgreSQL
2. Compilar o backend (NestJS)
3. Compilar o frontend (React)
4. Iniciar todos os containers
5. Rodar o seed (criar tabelas + usuário admin)

O primeiro build leva de 2 a 5 minutos.

### 4. Verificar se está tudo rodando

```bash
docker compose ps
```

Saída esperada:

```
NAME                    STATUS
fluodelivery-postgres   Up (healthy)
fluodelivery-api        Up
fluodelivery-web        Up
fluodelivery-seed       Exited (0)     ← Normal, roda uma vez e para
```

### 5. Acessar o sistema

- **Frontend (loja):** `http://ip-do-servidor/loja/demo`
- **Painel admin:** `http://ip-do-servidor/login`
- **Credenciais padrão:**
  - Email: `admin@fluodelivery.com`
  - Senha: `admin123`

> **Troque a senha padrão após o primeiro acesso.**

---

## Comandos Úteis

### Ver logs

```bash
# Todos os containers
docker compose logs -f

# Apenas o backend
docker compose logs -f api

# Apenas o frontend
docker compose logs -f web

# Apenas o banco
docker compose logs -f postgres
```

### Reiniciar serviços

```bash
# Reiniciar tudo
docker compose restart

# Reiniciar apenas o backend
docker compose restart api
```

### Parar tudo

```bash
docker compose down
```

### Parar e apagar todos os dados (banco + uploads)

```bash
docker compose down -v
```

> **Cuidado:** o `-v` apaga os volumes (banco de dados e uploads).

### Recriar apenas um serviço após alteração no código

```bash
# Rebuild e restart do backend
docker compose up -d --build api

# Rebuild e restart do frontend
docker compose up -d --build web
```

### Executar o seed novamente

```bash
docker compose run --rm seed
```

### Acessar o banco de dados via terminal

```bash
docker compose exec postgres psql -U fluodelivery -d fluodelivery
```

### Acessar o shell do container do backend

```bash
docker compose exec api sh
```

---

## Atualização do Sistema

Quando houver alterações no código:

```bash
cd /opt/fluodelivery

# 1. Puxar as alterações
git pull

# 2. Rebuild e restart
docker compose up -d --build

# 3. Se houver mudanças no schema do banco
docker compose exec api npx prisma db push
```

---

## Configuração com Domínio e HTTPS

### Opção 1: Usar um proxy reverso externo (recomendado)

Se você já tem Nginx ou Traefik no servidor, aponte para a porta 80 do container `web`.

No `docker-compose.yml`, troque a porta pública:

```yaml
web:
  ports:
    - "8080:80"  # Muda para porta interna, o proxy externo cuida do 80/443
```

### Opção 2: Adicionar Certbot ao docker-compose

Adicione ao `docker-compose.yml`:

```yaml
certbot:
  image: certbot/certbot
  volumes:
    - ./certbot/conf:/etc/letsencrypt
    - ./certbot/www:/var/www/certbot
  command: certonly --webroot -w /var/www/certbot -d seudominio.com.br --email seu@email.com --agree-tos --no-eff-email
```

E atualize o `nginx.conf` para servir HTTPS.

---

## Backup do Banco de Dados

### Criar backup

```bash
docker compose exec postgres pg_dump -U fluodelivery fluodelivery > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar backup

```bash
cat backup_20260413.sql | docker compose exec -T postgres psql -U fluodelivery -d fluodelivery
```

### Backup automático (cron)

Adicione ao crontab do servidor (`crontab -e`):

```
0 3 * * * cd /opt/fluodelivery && docker compose exec -T postgres pg_dump -U fluodelivery fluodelivery | gzip > /opt/backups/fluodelivery_$(date +\%Y\%m\%d).sql.gz
```

Isso cria um backup compactado todo dia às 3h da manhã.

---

## Resolução de Problemas

### Container `api` reiniciando em loop

```bash
docker compose logs api --tail 50
```

Causa comum: banco de dados não está pronto. O healthcheck do postgres deve resolver, mas se persistir:

```bash
docker compose restart api
```

### Erro "connection refused" no banco

Verifique se o postgres está healthy:

```bash
docker compose ps postgres
```

Se não estiver, verifique os logs:

```bash
docker compose logs postgres
```

### Frontend mostra página em branco

```bash
# Verificar se o Nginx está servindo
docker compose logs web

# Verificar se a API responde
docker compose exec web wget -qO- http://api:3000/api/empresas/by-slug/demo
```

### Uploads não funcionam

Verifique permissões do volume:

```bash
docker compose exec api ls -la /app/uploads
```

### Limpar tudo e recomeçar do zero

```bash
docker compose down -v
docker system prune -f
docker compose up -d --build
```

---

## Variáveis de Ambiente — Referência

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `DB_PASSWORD` | Sim | Senha do PostgreSQL |
| `JWT_SECRET` | Sim | Chave para assinar tokens de acesso (min. 32 caracteres) |
| `JWT_REFRESH_SECRET` | Sim | Chave para assinar refresh tokens (min. 32 caracteres) |

---

## Requisitos de Hardware (Produção)

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Disco | 10 GB | 20 GB+ (depende dos uploads) |
| OS | Linux (Ubuntu 22.04+) | Ubuntu 24.04 LTS |
