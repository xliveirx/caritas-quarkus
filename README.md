# Caritas — Plataforma de Gestão Social

Sistema de gestão para apoio às atividades da Caritas, permitindo o cadastro e acompanhamento de paróquias, famílias assistidas, coordenadores e voluntários.

```
caritas/
├── src/        # Backend (Quarkus)
└── src/main/resources/webapp/     # Frontend (Next.js)
```

---

## Backend

**Java 21 · Quarkus 3.35 · PostgreSQL**

| Dependência | Uso |
|---|---|
| `quarkus-rest` + `quarkus-rest-jackson` | API REST + serialização JSON |
| `quarkus-hibernate-orm-panache` | ORM com Active Record pattern |
| `quarkus-jdbc-postgresql` | Driver PostgreSQL |
| `quarkus-smallrye-jwt` | Emissão e verificação de JWT RS256 |
| `quarkus-elytron-security-jdbc` | Autenticação via banco |
| `quarkus-hibernate-validator` | Validação de DTOs |

### Rotas da API

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | — | Autenticação, retorna `{ token }` |
| `GET` | `/api/v1/users` | Autenticado | Dados do usuário logado |
| `PUT` | `/api/v1/users` | Autenticado | Atualiza nome e/ou senha |
| `GET` | `/api/v1/parishes` | ADMIN | Lista paginada de paróquias |
| `GET` | `/api/v1/parishes/{id}` | ADMIN | Detalhe de paróquia |
| `POST` | `/api/v1/parishes` | ADMIN | Cria paróquia |
| `PUT` | `/api/v1/parishes/{id}` | ADMIN | Atualiza paróquia |
| `DELETE` | `/api/v1/parishes/{id}` | ADMIN | Remove paróquia |
| `GET` | `/api/v1/coordinators` | ADMIN | Lista paginada de coordenadores |
| `GET` | `/api/v1/coordinators/{id}` | ADMIN | Detalhe de coordenador |
| `GET` | `/api/v1/coordinators/parish/{id}` | ADMIN | Coordenadores de uma paróquia |
| `POST` | `/api/v1/coordinators` | ADMIN | Cria coordenador |
| `PUT` | `/api/v1/coordinators/{id}` | ADMIN | Atualiza coordenador |
| `PATCH` | `/api/v1/coordinators/activate/{id}` | ADMIN | Ativa coordenador |
| `PATCH` | `/api/v1/coordinators/deactivate/{id}` | ADMIN | Desativa coordenador |
| `DELETE` | `/api/v1/coordinators/{id}` | ADMIN | Remove coordenador |
| `GET` | `/api/v1/volunteers` | ADMIN, COORDINATOR | Lista paginada de voluntários |
| `GET` | `/api/v1/volunteers/{id}` | ADMIN, COORDINATOR | Detalhe de voluntário |
| `GET` | `/api/v1/volunteers/parish/{id}` | ADMIN, COORDINATOR | Voluntários de uma paróquia |
| `POST` | `/api/v1/volunteers` | ADMIN, COORDINATOR | Cria voluntário |
| `PUT` | `/api/v1/volunteers/{id}` | ADMIN, COORDINATOR | Atualiza voluntário |
| `PATCH` | `/api/v1/volunteers/activate/{id}` | ADMIN, COORDINATOR | Ativa voluntário |
| `PATCH` | `/api/v1/volunteers/deactivate/{id}` | ADMIN, COORDINATOR | Desativa voluntário |
| `DELETE` | `/api/v1/volunteers/{id}` | ADMIN, COORDINATOR | Remove voluntário |
| `GET` | `/api/v1/families` | Autenticado | Lista paginada (ADMIN: todas; demais: da paróquia) |
| `GET` | `/api/v1/families/{id}` | Autenticado | Detalhe de família |
| `POST` | `/api/v1/families` | Autenticado | Cria família |
| `PUT` | `/api/v1/families/{id}` | Autenticado | Atualiza família |
| `DELETE` | `/api/v1/families/{id}` | Autenticado | Remove família |

---

## Frontend

**Next.js 16 · React 19 · TypeScript 5 · Tailwind CSS 4**

### Perfis de acesso

| Perfil | Módulos disponíveis |
|---|---|
| **ADMIN** | Dashboard, Paróquias, Famílias, Doações, Estoque, Visitas, Bazar, Configurações |
| **COORDINATOR** | Dashboard, Voluntários, Famílias, Doações, Estoque, Visitas, Bazar, Configurações |
| **VOLUNTEER** | Dashboard, Famílias, Doações, Estoque, Visitas |

### Rotas

| Rota | Perfil | Descrição |
|---|---|---|
| `/login` | — | Tela de autenticação |
| `/dashboard` | Todos | Página inicial |
| `/paroquias` | ADMIN | Lista de paróquias com criação, edição e exclusão |
| `/paroquias/[id]` | ADMIN | Detalhe: edição, coordenadores e voluntários da paróquia |
| `/voluntarios` | COORDINATOR | Voluntários da paróquia do coordenador |
| `/familias` | Todos | Gestão de famílias assistidas |

---

## Como rodar localmente

### Pré-requisitos

- Java 21+
- Maven 3.9+
- Node.js 20+
- PostgreSQL 15+

### 1. Banco de dados

Crie o banco no PostgreSQL:

```sql
CREATE DATABASE "caritas-db";
```

As credenciais padrão são `postgres / postgres` na porta `5432`. Para alterar, edite `src/main/resources/application.properties`.

### 2. Chaves JWT

Gere o par de chaves RSA na raiz do projeto:

```bash
openssl genrsa -out privateKey.pem 2048
openssl rsa -in privateKey.pem -pubout -out publicKey.pem
```

### 3. Backend

```bash
./mvnw quarkus:dev
```

API disponível em `http://localhost:8080`.

### 4. Frontend

```bash
cd webapp
npm install
npm run dev
```

Frontend disponível em `http://localhost:3000`.

> A variável `NEXT_PUBLIC_API_URL` define o endereço do backend. O padrão é `http://localhost:8080`.
