# Payday

Payday is a fast, friendly money decision app for salaried people in India.
It helps you understand your salary, compare real-life choices, and plan your future with confidence, without signups, without tracking, and without complicated finance jargon.

Live app: **https://payday.1cc.in**

## Why this project exists

Money decisions can feel heavy and confusing.
Payday makes them clear, practical, and stress-free with interactive tools that are easy to use for normal people, not just finance experts.

## Features

- **Simple and practical calculators** for real decisions, not theory.
- **Salary and tax focused tools** to help you understand your true take-home.
- **Career and life planning tools** for choices like offer comparison and buy vs rent.
- **Retirement planning support** with FIRE and SIP projections.
- **Privacy-first by design**: no account, zero tracking, all calculations in your browser.
- **Mobile-first experience** that works smoothly on phones and desktops.
- **Completely free** to use.

## Current tools

- In-hand Salary Calculator
- Salary Growth Calculator
- Job Offer Comparator
- Buy vs Rent Calculator
- FIRE Number Calculator
- SIP Future Value Calculator

## Quick start

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` in your browser.

## Helpful scripts

```bash
pnpm build      # production build
pnpm test       # run tests
pnpm lint       # run biome lint
pnpm format     # format code with biome
pnpm typecheck  # run TypeScript checks
pnpm check      # biome check + typecheck
```

## Contributing

This project is **open for contribution** and contributions are warmly welcome.

If you want to improve copy, fix bugs, add tools, improve UI, or write tests, jump in.
Every helpful PR makes Payday better for everyone.

Basic contribution flow:

1. Fork the repo
2. Create a branch
3. Make your change
4. Run `pnpm check` and `pnpm test`
5. Open a pull request

Please keep changes focused, readable, and user-friendly.

## Tech stack

- TanStack Start + TanStack Router
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Biome + Vitest

---

Built to help people make smarter money moves, one clear decision at a time.
