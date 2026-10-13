# Market Store

Marketplace for Mulungushi University, Zambia. Prices in ZMW.

## Targets
- Web (browser + installable PWA on Windows desktop) — apps/web
- iOS + Android — apps/mobile (Expo)
- API — apps/api (Node.js + Express, JavaScript)

## Requirements (all team members, all OSes)
- Node 20.11.0 (see .nvmrc)
- npm 10+
- Git
- VS Code
- PostgreSQL 15+ (local) OR a free Neon account

## First-time setup — Ubuntu

    git clone git@github.com:ORG/market-store.git
    cd market-store
    nvm install && nvm use
    npm install
    cp apps/api/.env.example apps/api/.env
    # edit apps/api/.env — set DATABASE_URL + JWT secrets
    npm run migrate
    npm run dev:api

## First-time setup — Windows (PowerShell)

    git clone git@github.com:ORG/market-store.git
    cd market-store
    nvm install 20.11.0
    nvm use 20.11.0
    npm install
    copy apps\api\.env.example apps\api\.env
    # edit apps\api\.env — set DATABASE_URL + JWT secrets
    npm run migrate
    npm run dev:api

## VS Code
On first open, install the recommended extensions when prompted
(defined in .vscode/extensions.json).

## Delivery fee
5 ZMW per 800 m block, rounded up. Single source of truth in
packages/shared/src/deliveryFee.js — used by API, web, and mobile.

## Team
| Role            | Owns                                    |
|-----------------|-----------------------------------------|
| Frontend Web    | apps/web                                |
| Mobile          | apps/mobile                             |
| Backend         | apps/api + packages/api-client          |
| Shared / QA     | packages/shared + testing               |

## Branch rules
- No direct pushes to main
- All changes via PR + 1 approval
- Keep PRs small (one feature per PR)
