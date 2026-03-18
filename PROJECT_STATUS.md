# Estado del proyecto nuevo

## Entregado

- monorepo nuevo en carpeta separada
- backend TypeScript modular
- frontend React moderno
- contratos compartidos
- esquema de datos de referencia
- documentacion de arquitectura
- base visual profesional para dashboard, triage, panel e integraciones
- soporte inicial multilenguaje `es/en/pt`
- audio de llamados de tickets modelado en backend y simulado en frontend
- panel publico nuevo con reproduccion de anuncio
- base de despliegue para Ubuntu Server con Nginx, systemd y Docker

## Falta para etapa productiva

- instalar dependencias del monorepo
- conectar Prisma a PostgreSQL real
- autenticacion y autorizacion completas
- persistencia real en vez de mock data
- testing automatizado
- CI/CD
- despliegue y observabilidad
- adaptadores reales para ERP/HIS/CRM
- proveedor TTS productivo o estrategia final de audio por sede

## Siguiente fase recomendada

1. instalar dependencias
2. levantar API y web
3. pasar modulos mock a Prisma
4. implementar autenticacion
5. separar panel publico y triage touch como apps finales del monorepo
