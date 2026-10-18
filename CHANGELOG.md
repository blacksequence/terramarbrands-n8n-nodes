# Changelog

## 0.2.0 (2026-10-18)

### Added

- Brand icon family — light and dark SVG icons for every node and the credential.
- Two-mode credential: fill `Usuario` + `Contraseña` and the nodes obtain the session
  token themselves on every execution (the credential's pre-authentication runs
  `POST /getConsultoriaLogin` and rides every operation on the returned token), or paste
  a `Token` to skip the automatic login. Both modes authenticate as
  `Authorization: Bearer <token>`.

### Changed

- Consultant data operations split into Leer and Actualizar, with a default action set of
  `CONTINUAR` / `TERMINAR` (always editable with n8n expressions).
- Fixed-value defaults baked into every field with a known production value: `seccion` =
  `CONSULTORIA`, `dominio` = `carrito.terramarbrands.com.mx`, `origen` = `CARRITONUE`
  (the cart SPA's fixed channel identifier), `opcion` = `PREBRANCH` and the warehouse and
  catalog action defaults. All remain editable with n8n expressions.

## 0.1.0

- Initial public release: 12 nodes covering the wsTerramarV2 service — session, catalog,
  cart, consultant profile, awards, orders, lineage, support, travel, certificates,
  payments and product nodes — plus the bearer-token credential.
