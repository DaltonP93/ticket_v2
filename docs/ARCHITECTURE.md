# Arquitectura

## Vision general

Sistema de ticket V2 se organiza en cuatro capas:

1. Experiencia
   - admin web
   - triage
   - paneles publicos
   - terminales touch

2. Aplicacion
   - casos de uso
   - orquestacion de reglas
   - control de permisos
   - publicacion de eventos

3. Dominio
   - tickets
   - tipos de ticket
   - colas
   - servicios
   - unidades
   - atenciones
   - perfiles de panel
   - plantillas de impresion
   - activos multimedia
   - conectores de integracion

4. Infraestructura
   - PostgreSQL
   - Redis
   - webhooks
   - proveedores de voz
   - generacion de QR y PDF
   - almacenamiento de media

## Modulos funcionales

- `catalog`
  - servicios
  - departamentos
  - unidades
  - prioridades

- `ticketing`
  - emision
  - tipos de ticket
  - reglas de prioridad
  - metadatos

- `triage`
  - formularios dinamicos
  - validacion previa
  - reimpresion

- `attendance`
  - llamada
  - inicio y cierre
  - redireccion
  - metricas

- `panels`
  - configuracion visual
  - layouts
  - historial
  - multimedia
  - audio de llamados

- `print`
  - plantillas
  - placeholders
  - branding por unidad

- `integrations`
  - outbound REST
  - inbound webhooks
  - logs
  - conectores por unidad

## Estrategia de integracion

- contratos de eventos canonicos
- conectores parametrizables
- mapeo entre dominio interno y payload externo
- logs y reintentos
- validacion sin bloquear cuando la regla sea opcional

## Multiunidad

Cada unidad puede tener:

- servicios habilitados
- tipos de ticket
- branding
- idioma principal
- plantillas
- playlist
- conectores propios
- configuracion de panel
- perfil de audio para llamados

## Internacionalizacion y audio

- idiomas base del sistema: espanol, ingles y portugues
- la UI comparte contratos de locale entre backend y frontend
- los paneles pueden definir idioma operativo y perfil de voz
- el llamado de tickets se modela como evento de dominio con texto de anuncio
- la primera implementacion web usa `speechSynthesis` para pruebas y demos
- la arquitectura deja abierta la sustitucion por TTS en nube, locucion local o motor hibrido

## Seguridad

- JWT o session por contexto
- roles: superadmin, admin unidad, operador, triage, monitor
- auditoria de cambios
- secretos fuera de codigo
- sanitizacion fuerte de plantillas y media
