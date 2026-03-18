# Sistema de Ticket V2

Proyecto nuevo, desacoplado de NovoSGA, disenado para evolucionar como plataforma moderna de gestion de tickets, triage, paneles, integraciones y configuracion visual multisede.

## Objetivos

- arquitectura modular y multiunidad
- backend moderno preparado para integraciones y eventos
- frontend administrativo y operativo con interfaz profesional
- soporte para tipos de ticket, plantillas de impresion, paneles y multimedia
- interfaz multilenguaje en espanol, ingles y portugues
- audio institucional para llamado de tickets y panel publico
- base extensible para ERP, HIS, CRM, webhooks y automatizaciones

## Stack propuesto

- Backend: Node.js + TypeScript + Fastify + Prisma + PostgreSQL + Redis
- Frontend: React + TypeScript + Vite
- Monorepo: npm workspaces
- Integraciones: REST, webhooks, adaptadores, colas y event bus

## Estructura

- `apps/api`: API modular, dominio y contratos operativos
- `apps/web`: interfaz administrativa, triage y paneles
- `packages/contracts`: tipos compartidos entre backend y frontend
- `docs`: arquitectura, roadmap y decisiones tecnicas
- `deploy`: archivos base para Nginx, systemd y compose productivo

## Estado del entregable

Este repositorio contiene una base nueva y profesional lista para evolucionar.
Se deja armado:

- monorepo
- arquitectura documentada
- backend modular base
- frontend base con interfaz moderna
- selector global de idioma `es/en/pt`
- simulacion de audio de llamados con `speechSynthesis`
- vista de panel publico con anuncio reproducible
- contratos compartidos
- esquema de base de datos de referencia

## Arranque esperado

1. Instalar dependencias con `npm install`
2. Levantar infraestructura con `docker compose up -d`
3. Configurar variables de entorno para API y web
4. Ejecutar `npm run dev --workspace @ticket-v2/api`
5. Ejecutar `npm run dev --workspace @ticket-v2/web`

## Prueba en servidor Ubuntu

La guia completa de despliegue quedo en:

- `docs/DEPLOY_UBUNTU.md`

Incluye:

- instalacion de Node.js, PostgreSQL, Redis y Nginx
- configuracion de `.env`
- build de API y web
- publicacion con `systemd`
- reverse proxy con Nginx
- SSL con Certbot
- checklist de testing funcional

## Capacidades ya modeladas

- tipos de ticket enriquecidos y servicios multiples
- paneles configurables por perfil visual
- integraciones y conectores empresariales
- anuncios de voz por idioma para llamados
- experiencia base para triage, admin y panel publico

## Principios de producto

- no acoplar UI con logica de negocio
- configurar por unidad y por perfil operativo
- modelar eventos de negocio desde el inicio
- soportar migracion gradual desde sistemas legados
- priorizar extensibilidad sobre parches puntuales
