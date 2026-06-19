# Caritas — Plataforma de Gestão Social

Sistema de gestão para apoio às atividades da Caritas, permitindo o cadastro e acompanhamento de paróquias, famílias assistidas, coordenadores e voluntários.

```
caritas/
├── src/        # Backend (Quarkus · Java 21)
├── webapp/     # Frontend (Next.js 16)
└── docker/     # Docker Compose configs
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Java 21, Quarkus 3.35, Hibernate ORM Panache, SmallRye JWT (RS256) |
| Frontend | Next.js 16, React 19, TypeScript 5, Tailwind CSS 4 |
| Banco | PostgreSQL 16 |

---

## Como rodar

Existem dois modos de execução. Escolha conforme a necessidade:

| Modo | Quando usar |
|---|---|
| [Docker completo](#opção-1-docker-completo) | Subir tudo de uma vez (banco + backend + frontend) |
| [Só o banco no Docker](#opção-2-só-o-banco-no-docker--backend-e-frontend-locais) | Desenvolvimento ativo — backend e frontend rodam localmente com hot reload |

---

### Opção 1: Docker completo

Sobe PostgreSQL, backend e frontend em contêineres. Não requer Java ou Node instalados localmente.

**Pré-requisitos:** Docker + Docker Compose

```bash
docker compose -f docker/docker-compose.full.yml up --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| PostgreSQL | localhost:5432 |

Para parar e remover os contêineres:

```bash
docker compose -f docker/docker-compose.full.yml down
```

Para remover também o volume do banco (dados apagados):

```bash
docker compose -f docker/docker-compose.full.yml down -v
```

---

### Opção 2: Só o banco no Docker + backend e frontend locais

Ideal para desenvolvimento, pois o backend roda em modo dev (hot reload) e o frontend usa o Next.js dev server.

**Pré-requisitos:** Docker, Java 21+, Maven 3.9+, Node.js 20+

#### 1. Banco de dados

```bash
docker compose -f docker/docker-compose.db.yml up -d
```

Isso sobe um PostgreSQL na porta `5432` com:

| Variável | Valor |
|---|---|
| Usuário | `postgres` |
| Senha | `postgres` |
| Banco | `caritas-db` |

#### 2. Chaves JWT

Na primeira execução, gere o par de chaves RSA na raiz do projeto:

```bash
openssl genrsa -out privateKey.pem 2048
openssl rsa -in privateKey.pem -pubout -out publicKey.pem
```

#### 3. Backend

```bash
./mvnw quarkus:dev
```

API disponível em `http://localhost:8080`. O Quarkus recarrega automaticamente ao salvar arquivos Java.

#### 4. Frontend

```bash
cd webapp
npm install
npm run dev
```

Frontend disponível em `http://localhost:3000`.

> A variável `NEXT_PUBLIC_API_URL` define o endereço do backend. O padrão já é `http://localhost:8080`.

#### Parar o banco

```bash
docker compose -f docker/docker-compose.db.yml down
```

---

## Perfis de acesso

| Perfil | Módulos disponíveis |
|---|---|
| **ADMIN** | Dashboard, Paróquias, Famílias, Doações, Estoque, Visitas, Bazar, Configurações |
| **COORDINATOR** | Dashboard, Voluntários, Famílias, Doações, Estoque, Visitas, Bazar, Configurações |
| **VOLUNTEER** | Dashboard, Famílias, Doações, Estoque, Visitas |

---

## Rotas da API

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | — | Autenticação, retorna `{ token }` |
| `GET` | `/api/v1/users` | Autenticado | Dados do usuário logado |
| `PUT` | `/api/v1/users` | Autenticado | Atualiza nome e/ou senha |
| `GET` | `/api/v1/parishes` | ADMIN | Lista paginada de paróquias |
| `POST` | `/api/v1/parishes` | ADMIN | Cria paróquia |
| `PUT` | `/api/v1/parishes/{id}` | ADMIN | Atualiza paróquia |
| `DELETE` | `/api/v1/parishes/{id}` | ADMIN | Remove paróquia |
| `GET` | `/api/v1/coordinators` | ADMIN | Lista paginada de coordenadores |
| `GET` | `/api/v1/coordinators/parish/{id}` | ADMIN | Coordenadores de uma paróquia |
| `POST` | `/api/v1/coordinators` | ADMIN | Cria coordenador |
| `PUT` | `/api/v1/coordinators/{id}` | ADMIN | Atualiza coordenador |
| `PATCH` | `/api/v1/coordinators/activate/{id}` | ADMIN | Ativa coordenador |
| `PATCH` | `/api/v1/coordinators/deactivate/{id}` | ADMIN | Desativa coordenador |
| `DELETE` | `/api/v1/coordinators/{id}` | ADMIN | Remove coordenador |
| `GET` | `/api/v1/volunteers` | ADMIN, COORDINATOR | Lista paginada de voluntários |
| `GET` | `/api/v1/volunteers/parish/{id}` | ADMIN, COORDINATOR | Voluntários de uma paróquia |
| `POST` | `/api/v1/volunteers` | ADMIN, COORDINATOR | Cria voluntário |
| `PUT` | `/api/v1/volunteers/{id}` | ADMIN, COORDINATOR | Atualiza voluntário |
| `PATCH` | `/api/v1/volunteers/activate/{id}` | ADMIN, COORDINATOR | Ativa voluntário |
| `PATCH` | `/api/v1/volunteers/deactivate/{id}` | ADMIN, COORDINATOR | Desativa voluntário |
| `DELETE` | `/api/v1/volunteers/{id}` | ADMIN, COORDINATOR | Remove voluntário |
| `GET` | `/api/v1/families` | Autenticado | Lista paginada (ADMIN: todas; demais: da paróquia) |
| `POST` | `/api/v1/families` | Autenticado | Cria família |
| `PUT` | `/api/v1/families/{id}` | Autenticado | Atualiza família |
| `DELETE` | `/api/v1/families/{id}` | Autenticado | Remove família |

---

## Rotas do Frontend

| Rota | Perfil | Descrição |
|---|---|---|
| `/login` | — | Tela de autenticação |
| `/dashboard` | Todos | Página inicial |
| `/paroquias` | ADMIN | Lista de paróquias com criação, edição e exclusão |
| `/paroquias/[id]` | ADMIN | Detalhe: edição, coordenadores e voluntários da paróquia |
| `/voluntarios` | COORDINATOR | Voluntários da paróquia do coordenador |
| `/familias` | Todos | Gestão de famílias assistidas |
