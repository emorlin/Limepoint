# 🟢 LimePoint — Americano made simple

> ⚠️ _Quick & dirty. Vibe-kodat på kvällstid. Inte perfekt — men snabbt, fungerande och spelbart._

---

## 🧩 Om projektet

**LimePoint** är en webbaserad plattform för padelturneringar av typen **Americano**.  
Appen gör det möjligt att skapa gemenskaper, lägga till spelare, generera automatiska spelscheman och rapportera resultat — allt direkt i webbläsaren, utan appar eller Excel-blad.

Detta är ett **personligt experiment i snabb produktutveckling**, byggt med moderna verktyg och med fokus på:
- **Flöde framför perfektion**  
- **Funktion framför formell typning**  
- **En smidig spelupplevelse framför pixel-perfekt design**

---

## ⚙️ Teknikstack

| Del                  | Teknik / Tjänst                                            | Kommentar                                        |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| **Frontend**         | [React 18](https://react.dev) + [Vite](https://vitejs.dev) | Modern utvecklingsmiljö med snabb build-pipeline |
| **Styling**          | [Tailwind CSS](https://tailwindcss.com)                    | Utility-first, dark mode, limegrönt tema         |
| **Routing**          | [React Router v6](https://reactrouter.com)                 | Klientbaserad navigering                         |
| **Databas & API**    | [Supabase](https://supabase.com)                           | PostgreSQL med Row Level Security                |
| **Hosting**          | [Vercel](https://vercel.com)                               | CI/CD, preview deploys och edge-hosting          |
| **Datamodell**       | `communities` / `players` / `tournaments` / `matches`      | Relationsdatabas med foreign keys                |
| **State management** | React Hooks (`useState`, `useEffect`, `useMemo`)           | Enkel hook-baserad logik — ingen Redux           |
| **Utilities**        | TypeScript (non-strict), ESLint, Prettier                  | Grundläggande typning och linting                |

---

## 🚧 Kodstil & filosofi

> LimePoint är **vibe-kodat** – snabbt, iterativt och utan överdrivet typ- eller arkitektur-formaliteter.

- **TypeScript-strict** är **avstängt** (avsiktligt).  
- Fokus ligger på **funktionalitet, flöde och feedback-loopar**, inte på enterprise-nivåtypning.  
- Koden är skriven med **klar struktur men hög tolerans för refaktorering**.  

**Målet:** ett fungerande och roligt verktyg för Americano-turneringar.  
**Icke-mål:** 100% typ-säkerhet, test coverage eller generisk skalbarhet.

---

## 🏗️ Projektstruktur

```
src/
├─ components/        # UI-komponenter (Tournaments, Leaderboard, etc.)
├─ lib/
│  ├─ supabase.ts     # Supabase-klient
│  └─ data/           # Datahämtningsmetoder (players, communities, tournaments)
├─ pages/             # React-routes (Home, Community, Play, Create, etc.)
├─ utils/             # Americano-logik och hjälpfunktioner
└─ main.tsx           # Entrypoint
```

---

## 🌍 Deployment

| Miljö              | URL                                                  | Branch                                                       |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------ |
| **Production**     | [limepoint.vercel.app](https://limepoint.vercel.app) | `main`                                                       |
| **Preview builds** | unika Vercel-länkar                                  | `feature/*`                                                  |
| **Database**       | Supabase Cloud                                       | miljövariabler `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

**Lokal utveckling**
```bash
npm install
npm run dev
```

**Bygg för produktion**
```bash
npm run build
```

---

## 🎾 Funktioner

✅ Skapa gemenskap  
✅ Lägg till spelare  
✅ Skapa turnering (4, 8, 12 eller 16 spelare)  
✅ Automatiskt Americano-schema  
✅ Inmatning av resultat  
✅ Poängtabell & ranking  

**Planerade tillägg**
- 🔸 Matchhistorik per spelare  
- 🔸 Dark/light-toggle  
- 🔸 Supabase Auth (inloggning)  
- 🔸 Publikt API för externa scoreboard-visningar  

---

## 📈 Syfte & lärdomar

LimePoint är byggt som en **praktisk proof-of-concept** i att snabbt få en fungerande helhet i stacken:
- full CRUD-integration med Supabase,
- distribuerad på Vercel,
- semantiskt ren React-struktur utan ramverksöverbyggnad.

Projektet fungerar också som **en övning i balans** mellan _teknisk stringens_ och _produktkänsla_.  

---

## 📄 Licens

MIT © 2025 — _Use, build, refactor and vibe responsibly._
