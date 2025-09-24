# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15.5.3 application with TypeScript and Tailwind CSS v4, using the App Router architecture with Turbopack enabled for both development and production builds.

## Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Code Generation Guidelines

**IMPORTANT**: When generating any code, ALWAYS first refer to the relevant documentation files within the `/docs` directory to understand existing patterns, conventions, and best practices before implementation.

- /docs/ui.md

## Architecture

- **App Router**: Located at `src/app/` with `layout.tsx` and `page.tsx` files
- **Styling**: Tailwind CSS v4 with PostCSS configuration
- **Path Alias**: `@/*` maps to `./src/*` for cleaner imports
- **Font System**: Uses Geist fonts configured in the root layout
