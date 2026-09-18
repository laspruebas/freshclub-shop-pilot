# FRUTI Frontend

Frontend web del flujo FRUTI desplegado en Vercel.

## Flujo principal

WhatsApp → backend → link firmado → onboarding → pedido → reporte

El acceso a las pantallas privadas usa un token de sesión firmado generado por el backend y recibido como:

```text
?t=<session_token>
```

La validación se centraliza en `session.js` contra:

```text
GET /fruti/session-validate
```

## Estructura

```text
config.js
session.js
utils.js

order/
  api.js
  dashboard.js
  delivery.js
  load.js
  model.js
  render.js
  search.js
  submit.js
  styles.css

onboarding/
  api.js
  model.js
  render.js
  submit.js
  wizard.js
  styles.css

report/
  api.js
  render.js
  styles.css

admin/
  api.js
  editor.js
  render.js

invite/
  styles.css
```

Las páginas principales quedan como controladores livianos:

- `index.html` + `app.js`: pedido semanal.
- `household.html` + `household.js`: onboarding.
- `report.html` + `report.js`: evolución histórica.
- `invite.html` + `invite.js`: referral.
- `admin-products.html` + `admin-products.js`: administración interna de productos.
- `origen.html`: mock visual temporal de trazabilidad; todavía no consume trazabilidad real.

## CSS

`styles.css` contiene estilos globales compartidos.

Los estilos específicos viven por dominio:

- `order/styles.css`
- `onboarding/styles.css`
- `report/styles.css`
- `invite/styles.css`
- `admin-products.css`

## Pendiente de arquitectura

La plataforma evolucionará a un modelo multitenant. La autenticación y autorización del área admin se definirá junto con ese diseño; no debe considerarse producción-ready hasta entonces.
