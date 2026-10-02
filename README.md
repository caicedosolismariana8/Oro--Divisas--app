# Aurum Señal

Web en español, adaptada a iPad y móvil, que consulta velas reales de 5 minutos para XAU/USD y pares de divisas, valida su antigüedad y presenta una lectura técnica **COMPRA**, **VENTA** o **ESPERAR**.

La publicación es completamente estática: `index.html` carga directamente la hoja de estilos y los módulos JavaScript, sin depender de transformaciones de un empaquetador en el navegador.

## Antes de empezar

- La aplicación no contiene datos ficticios ni un modo demo. Sin fuente, ante un error o con datos de más de 20 minutos, muestra **ESPERAR** y oculta Entrada, Stop Loss y Take Profit.
- Usa la API de [Twelve Data](https://twelvedata.com/pricing). Puedes crear una clave gratuita; no es necesario contratar un servicio de pago. Los límites y los instrumentos disponibles dependen del proveedor.
- La clave se guarda en `localStorage` del navegador. Al ser una web estática, no es un secreto fuerte: usa una clave gratuita limitada y no una credencial de bróker.
- MetaQuotes-Demo e INFINOX no se conectan ni reciben órdenes. Los niveles se copian para introducirlos manualmente en MetaTrader 5.
- El análisis es informativo y no promete rentabilidad.

## Ejecutar

```bash
npm run dev
```

Abre la dirección mostrada por el servidor, pulsa el engranaje y pega tu clave. Para verificar el proyecto:

```bash
npm test
npm run build
```

## Publicar gratis desde un iPad

La opción más sencilla es **Cloudflare Pages** o **Netlify**, conectando este repositorio desde Safari:

1. Sube el repositorio a GitHub desde la web de GitHub.
2. En Cloudflare Pages o Netlify elige **Importar un repositorio existente** y autoriza GitHub.
3. Usa `npm run build` como comando de compilación y `dist` como directorio de salida. El proyecto no necesita instalar dependencias.
4. Publica y abre la URL HTTPS resultante en Safari. Todo el proceso se puede completar desde iPad.
5. En la web publicada, configura tu clave gratuita con el engranaje. Cada dispositivo guarda su propia copia.

No introduzcas claves de MetaTrader, MetaQuotes-Demo o INFINOX. Si en el futuro se desea ocultar la clave del proveedor, hará falta una función serverless; debe evaluarse el coste antes de contratarla.

## Criterio de la señal

- Tendencia: EMA 9 frente a EMA 21.
- Momentum: RSI 14 (COMPRA entre 52–70; VENTA entre 30–48).
- Riesgo orientativo: Stop Loss a 1,5 ATR y Take Profit a 2,25 ATR.
- Seguridad: mínimo 30 velas válidas; más de 20 minutos de antigüedad, datos incompletos o falta de confluencia implican ESPERAR sin niveles.
