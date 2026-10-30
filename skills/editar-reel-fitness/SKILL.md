---
name: editar-reel-fitness
description: Monta y edita un reel vertical en español con el estilo de Paco para contenido de fitness/suplementos, y lo renderiza con HyperFrames, a partir de una carpeta con el vídeo principal (cabeza parlante, ya montado o en clips en bruto) y recursos extra (otros clips e imágenes). Pide la carpeta y las ideas especiales, usa todos los recursos (cortes a B-roll, imágenes, ventanas), crea gráficos propios animados (barras, contadores, comparativas, muñecos haciendo acciones, señales, listas, líneas), y añade gancho, subtítulos grandes con palabras clave en azul, pegatinas, zooms, efectos y sonidos. Úsala cuando el usuario pida editar o montar un reel, short o TikTok de fitness/suplementos. Para contenido de programación/desarrollo usa `editar-reel-developer` en su lugar.
---

# Editar reel (estilo Paco)

Pipeline probado en "Reel El mejor PreEntreno" (oct 2026). El usuario **no quiere volver a explicar el estilo**: haz solo las dos preguntas del paso 0, aplica todo lo de abajo y renderiza al final. Responde en español.

## Estilo final aprobado (respétalo)

**SÍ**
- **Formato:** 1080x1920 a 30 fps.
- **Gancho:** en los primeros 2 s, dos líneas grandes en MAYÚSCULAS, arriba y por encima de la cabeza. Usa League Gothic 156 px: la línea 1 sobre bloque azul marino `#0A1A3F` y la línea 2 sobre bloque azul `#1E6BFF`. Entra con golpe (impact-bass-1 + whoosh-short), destello blanco y temblor de cámara. Durante el gancho se ve siempre al presentador, sin B-roll.
  - **El gancho va siempre en los azules de siempre** (azul marino y azul), aunque el tema sea de errores: el usuario probó el gancho rojo (`hook.theme: "red"`) y prefirió volver al azul. Úsalo en rojo solo si lo pide expresamente.
- **Subtítulos (lo protagonista):**
  - Grandes y en el centro del vídeo, a la altura del pecho (`captionsTop` ≈ 1140 px), sin fondo: solo letras.
  - Montserrat 900 en MAYÚSCULAS, 78 px, blancas con contorno azul marino `#061230`.
  - Palabras clave en azul `#4FB3FF` a 86 px. Grupos de 1–3 palabras.
  - Cada grupo entra con un rebote y cada palabra salta al decirla; las palabras clave saltan más y con un pequeño giro.
  - Los subtítulos van por encima del B-roll y de los paneles.
  - **Se quitan solo donde serían redundantes,** es decir, donde una animación propia ya muestra con texto lo que se dice:
    - durante el gancho;
    - durante los gráficos animados a pantalla completa.

    `build-reel.cjs` lo hace solo.
  - **Sobre las imágenes del usuario SÍ hay subtítulos,** tanto las que ya vienen en su vídeo (capturas de estudios, gráficas) como las de la carpeta. Son una referencia visual, no repiten lo que se dice. El usuario lo corrigió expresamente: no uses `noCaptions` para ellas.
- **Recursos del usuario (B-roll):** usa **todos** los clips e imágenes de la carpeta (ver la sección "Recursos de la carpeta").
- **Gráficos propios:** cuando ayuden a validar una idea, monta escenas animadas desde cero (ver "Gráficos propios").
- **Pegatinas de conceptos:** cuando se nombra una herramienta o un concepto que no tiene recurso ni gráfico propio, aparece un disco blanco con borde azul y su etiqueta, a la izquierda o a la derecha de la cabeza (`top` 560 px), nunca encima de la cara ni del objeto que sostiene. Son dibujos de `scripts/art.cjs` o un emoji Twemoji (un solo emoji por pegatina).
- **Cámara** (`#cam`, con el origen en la cara):
  - zoom rápido (1,15–1,26) en las palabras clave;
  - acercamientos lentos (1,0 → 1,12) mientras explica;
  - vuelta a 1,0 tras cada golpe;
  - temblor en los golpes fuertes (gancho, momento negativo, revelación, remate final).
- **Efectos ligados a palabras:**
  - anillo azul expansivo desde los subtítulos en los conceptos clave;
  - sello gigante azul con un número o "+1";
  - destello rojo en los bordes y temblor de los subtítulos en los momentos negativos;
  - destello blanco en las revelaciones.
- **Sonido:**
  - momentos **positivos**: chime, sparkle, notification, ping;
  - momentos **negativos**: error, glitch;
  - revelaciones y golpes: impact-bass-1/2, con whoosh o riser antes;
  - whoosh automático al entrar en cada B-roll o gráfico, y pop automático en cada pegatina;
  - nunca un sonido negativo en un logro.
  - **Usa los sonidos clásicos de la biblioteca** (los que no llevan prefijo de categoría: impact-bass-1/2, whoosh, whoosh-short, riser, chime, sparkle, ping, notification, error, glitch, pop, click…). El usuario probó un juego de sonidos nuevos y **prefirió los de siempre**.
    - Los sonidos con prefijo (`impact-boom…`, `tension-…`, `heartbeat-…`, `coin-…`) solo se usan si el usuario pide sonidos nuevos o distintos.
    - Para conseguir más: `node $SK/scripts/fetch-sfx.cjs <categoría> "<búsqueda en inglés>"`.
  - **Tensión antes de una pregunta o giro dramático** ("¿y cuál es el problema?"):
    - un `riser` recortado (inicioEnElArchivo ≈ 8, duración ≈ 2) que empiece en la pregunta y acabe justo cuando llega la respuesta;
    - un acercamiento lento de cámara (1,0 → 1,13) durante la pregunta.
  - **Momento de énfasis en una frase clave negativa** (p. ej. "y por eso no progresas"). Por defecto lleva tres piezas:
    1. **Zoom hacia la cara:** keyframe en `cam` hasta 1,3, que empiece justo en `t0` y dure unos 0,4 s. Vuelve a 1,0 al acabar la frase.
    2. **Callout:** la frase en grande con una X roja de error, centrada sobre el pecho (y ≈ 1120) para no tapar la cara aunque haya zoom. Va en `callouts`; mientras se ve, se ocultan los subtítulos.
    3. Un `impact-bass-2` suave (volumen 0,4) cuando entra la X.

    **Pantalla gris + voz con eco (NO por defecto):** solo se añade si el usuario lo pide expresamente en la pregunta de ideas especiales del paso 0 (p. ej. "pon el efecto gris"). Si no lo pide, no se aplica.
    - `node $SK/scripts/emphasis.cjs $PROJ <t0-t1> --voz=eco`. Graba el efecto en el vídeo: la imagen pasa a gris y la voz lleva un **eco muy suave**: una sola repetición floja (15 %) a 240 ms, sin compresión ni subida de volumen y con limitador a −1 dB. Después de la frase, la voz original baja al 90 % durante 0,3 s. El usuario pidió reducir el eco dos veces porque saturaba y no se entendía a la primera: la frase debe entenderse perfectamente, así que **nunca subas el eco ni la ganancia**.
    - `--voz=grave` da una voz más grave y con más cuerpo, pero el usuario prefirió el eco cuando lo pide.
    - `--sin-gris` mantiene el color.
    - Guarda el original en `assets/reel-original.mp4` y se puede repetir sin acumular efectos.
    - Mide el volumen después (`volumedetect` en ese tramo, comparado con `reel-base`): debe quedar al mismo nivel (±1 dB) y con el pico por debajo de −1,5 dB. El peso lo dan el gris, el zoom y el texto, no el volumen.

    **Dónde va:** en la frase del **principio** que plantea el problema o la amenaza ("y uno de ellos puede estar frenando tus ganancias", "y por eso no progresas"), no en la explicación posterior. El usuario lo corrigió: el énfasis es para el gancho, no para el desarrollo. Normalmente cae justo después del gancho: haz que el gancho acabe cuando empieza la frase (`hook.t1 = t0`) para que el gancho dé paso al callout y la frase no aparezca dos veces en pantalla. El texto del callout debe aparecer 0,3–0,5 s después de la X, no esperar a la última palabra. Úsalo 1 vez por reel.
  - **Enumeraciones** ("existen 3 tipos de…", "hay 3 errores…"): usa `iconRow`.
    - **Iconos borrosos con "?" antes de nombrar el primero:** solo si el vídeo dice explícitamente "pasos" o numera la lista como pasos (p. ej. "sigue estos 3 pasos", "en 3 pasos"). Si solo enumera conceptos sin llamarlos "pasos" (p. ej. "hay 3 tipos de fallo"), no los pongas borrosos: empieza directamente mostrando nítido el primero en cuanto se nombra.
    - Cada vez que nombra uno reaparecen los N: el que nombra pasa de difuminado a nítido, se destaca con su etiqueta y los anteriores ya se ven.
    - Va sobre el pecho (y ≈ 1060), sin subtítulos mientras se ve.
    - Sustituye a los callouts de título por punto: no pongas ambos.
  - **Dos opciones a distinguir** ("esto duele" frente a "no puedo más"): dos pegatinas en el propio vídeo, una a cada lado de la cabeza, que aparecen cuando nombra cada una, con un icono y una etiqueta de una o dos palabras ("Dolor", "No puedo"). No uses una lista a pantalla completa para esto. Evita emojis que llenen todo el círculo, como 🛑, porque se recortan.
- **Volumen:** si el clip ya trae música (CapCut), los efectos van moderados (volumen 0,3–0,6). El vídeo va a 1,0 tras el paso de calidad (a 0,9 sin él).

**MENOS ES MÁS (presupuesto máximo para un reel de 40–60 s; el usuario pidió simplificar)**
- **Gráficos propios:** 1–3 en total, solo para las ideas que nada más ilustra.
- **Pegatinas:** 2–3.
- **Zooms rápidos:** 2–4, además del del gancho. Los acercamientos lentos, solo si aportan.
- **Sellos:** 1. **Anillos:** 0–2. **Destellos rojos:** como mucho 1.
- **Sonidos:** unos 10–14 en total, ninguno pegado a otro. Golpes solo en el gancho y en 1–2 momentos clave.
- **Una sola ayuda visual por idea.** Si ya hay una imagen del usuario (insertada en su vídeo o en la carpeta) que muestra lo que se dice, no se añade gráfico animado, pegatina ni zoom; los subtítulos se mantienen. Lo redundante es explicar dos veces con animaciones y texto propios: ahí sí sobra el subtítulo.
- Debe haber tramos de 3–5 s con solo el presentador y los subtítulos. Si una revisión de fotogramas parece un collage, quita cosas.

**NO** (el usuario lo pidió quitar)
- Sobrecargar con efectos, pegatinas, gráficos y sonidos seguidos.
- Gráficos que repiten lo que ya enseña una imagen del usuario. Ejemplo: contadores de "49 estudios" o "1,6 g/kg" cuando ya sale la captura del estudio.
- Titulares en tarjeta arriba ni barras de progreso o carga.
- Logos de marcas en pegatinas, sobre todo de la marca del producto que critica: usa dibujos o emojis. Los logos que estén en los recursos del usuario sí se usan.
- Explosiones o lluvias de varios emojis iguales alrededor del texto.
- Subtítulos pequeños con fondo o en caja.

## Requisitos (comprueba una vez y arregla lo que falte)
- Node ≥ 22, `ffmpeg` y `ffprobe` (si faltan: `scoop install ffmpeg`).
- whisper.cpp: `whisper-server` (si falta: `scoop install whisper-cpp`) y el modelo `~/.cache/hyperframes/whisper/models/ggml-large-v3-turbo.bin` (descárgalo de `https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin`).
- Las skills de HyperFrames (`hyperframes`, `hyperframes-core`, `general-video`): sigue sus reglas de composición. `npx hyperframes doctor` diagnostica el entorno.

Variables: `SK=~/.claude/skills/editar-reel`, `SRC=<carpeta del usuario>`, `PROJ=<carpeta del proyecto>`.

## Flujo

### 0. Dos preguntas, siempre y antes de nada
1. **Carpeta exacta.** Pide siempre el directorio donde están el clip o los clips y todos los recursos del reel (vídeos e imágenes):
   - llama a `request_directory` **sin ruta** para que la elija con el selector de carpetas; si es una herramienta diferida, cárgala antes con ToolSearch `select:mcp__ccd_directory__request_directory`;
   - si el usuario ya escribió una ruta en su mensaje, pásala igualmente por el selector para confirmarla;
   - si el selector no está disponible, pregunta en el chat: "¿En qué carpeta están el clip y los recursos del reel?".
2. **Ideas especiales.** Justo después, pregunta con `AskUserQuestion`: "Además del estilo y el plan habituales, ¿quieres incluir alguna característica especial o idea en este reel?". Opciones:
   - "No, usa el estilo de siempre (Recommended)";
   - "Sí, tengo ideas" (el usuario puede escribirlas en "Other").

   Si elige "Sí" sin escribirlas, pídeselas en el chat. Anota esas ideas en `$PROJ/BRIEF.md` y cúmplelas con prioridad sobre el estilo por defecto (si chocan con un "NO", gana lo que pida ahora).

   **Importante:** lo que responda aquí es solo para este vídeo. No lo conviertas en una regla nueva de este SKILL.md ni la recuerdes para el siguiente reel, salvo que el usuario diga expresamente que quiere dejarlo fijo a partir de ahora.
3. **Brutos o limpios.** Justo después, pregunta con `AskUserQuestion`: "¿El contenido de la carpeta son clips en bruto (grabación sin editar, con repeticiones o muletillas) o clips ya limpios y listos para montar?". Opciones:
   - "Clips limpios, listos para montar";
   - "Clips en bruto, hay que seleccionar y ordenar las frases".

   La respuesta decide cómo se trata el A-roll en el paso 2 (uso directo/concatenado, o "Flujo de brutos").

Después no preguntes nada más: decide tú y renderiza.

### 1. Proyecto
- En `$SRC`: `npx hyperframes init <nombre-reel>-editado --non-interactive --example=blank --skill=general-video`. Así `$PROJ = $SRC/<nombre-reel>-editado`. Si `$SRC` no es una carpeta de la sesión, la concede `request_directory`.
- Crea `$PROJ/work/tx/`.
- Copia `$SK/assets/sfx` y `$SK/assets/emoji` en `$PROJ/assets/`.
- Escribe `{"type":"commonjs"}` en `$PROJ/work/package.json` (el proyecto es un módulo ES). Los scripts de la skill son `.cjs`.

### 2. Inventario de recursos
`node $SK/scripts/assets.cjs scan "$SRC" "$PROJ"`. Recorre `$SRC` (subcarpetas incluidas, excepto la del proyecto) y para cada vídeo o imagen:
- mide tamaño, orientación, duración y proporción de voz;
- prepara una copia ligera en `$PROJ/assets/media/`;
- lo clasifica como **A-ROLL** (habla, cabeza parlante), **B-ROLL** o **IMAGEN**.

**Orden cuando hay más de un vídeo.** Si en la carpeta hay más de un vídeo, su nombre debe empezar por el número de orden (`1 - ...`, `2 - ...`, `3 - ...`). Ordénalos siempre por ese número, nunca por orden alfabético normal ni por fecha de creación. Si algún vídeo no lleva número, pregunta el orden antes de seguir.

Revisa la clasificación y mira un fotograma de cada recurso para saber qué muestra. Para el A-roll, usa la respuesta de la pregunta "Brutos o limpios" del paso 0:
- **Limpios, un solo vídeo:** comprueba que es 1080x1920 a 30 fps (si no, `scale=1080:1920,fps=30`), cópialo a `$PROJ/assets/reel.mp4` y extrae `work/audio.wav` (`-vn -ar 16000 -ac 1`).
- **Limpios, varios vídeos:** cada uno ya es usable tal cual; únelos sin más edición de contenido, en el orden de su número, y continúa igual que con un solo vídeo.
- **Brutos (uno o varios archivos):** haz el "Flujo de brutos" (más abajo). Si hay varios archivos, procésalos respetando el orden de su número.
- **Todo lo demás es material de apoyo** y se usa entero.

**Calidad de audio (siempre, antes del énfasis).** Solo audio: la imagen no se retoca ni se regrada, se usa tal cual viene en el vídeo original.
1. `node $SK/scripts/enhance.cjs $PROJ` trabaja sobre el A-roll:
   - **Audio:** ecualiza la voz (quita graves sobrantes y "barro", más presencia y aire), suaviza las eses y normaliza a −14 LUFS con pico de −1 dBTP en dos pasadas.
   - **Vídeo:** sin tocar (copia tal cual, sin enfoque, sin recodificar, sin cambios de color).
   - **Archivos:** guarda `assets/reel-original.mp4` y `assets/reel-base.mp4`; `emphasis.cjs` parte de `reel-base` si existe.
   - **Sin reducción de ruido:** los vídeos de CapCut suelen llevar una base musical bajo la voz y la estropearía. Compruébalo midiendo una pausa entre frases: si no baja de unos −30 dB, hay música.
2. Con el audio ya normalizado, pon `volume: 1.0` en el plan. No pongas `grade` en el plan (no se aplica ningún tratamiento de color por defecto).

**Música de fondo (siempre, instrumental y sutil — no te la saltes).** Todo reel lleva una música de fondo, sin voz ni letra, que acompaña sin tapar la voz del presentador. `build-reel.cjs` ya coloca esta pista (`<audio id="bgm">`) cuando el plan trae el campo `bgm`; si no lo rellenas, el reel sale sin música.
1. Primero prueba `npx hyperframes media-use resolve --type bgm --intent "música instrumental, solo melodía con instrumentos, sin voz ni letra, estilo clásica, alegre, melódica y sencilla" --project .` (el catálogo de `media-use` es de uso libre, sin problema de copyright).
2. **Si falla porque no está la CLI de HeyGen** (o por cualquier otro motivo), no lo dejes sin música: busca una pista CC0 en Openverse (`https://api.openverse.org/v1/audio/?q=<búsqueda en inglés, ej. "happy acoustic instrumental">&license=cc0&page_size=20`), elige una de 35-300 s, descárgala a `$PROJ/assets/media/bgm.mp3` y normalízala con `ffmpeg -af "loudnorm=I=-20:TP=-3:LRA=9"`. Anota título, autor y licencia en el resumen final.
3. Ponla en el plan como `bgm: {"src": "assets/media/bgm.mp3", "volume": 0.12}`: muy por debajo de la voz, solo de fondo. Si el A-roll ya trae música propia de CapCut, no añadas una segunda: con una basta.
4. Debe sonar discreta en todo el reel, sin picos que compitan con la voz ni con los efectos de golpe. Comprueba en el render final que se oye (aunque sea de fondo).

**Imágenes ya insertadas en el vídeo principal.** Muchas veces el clip de CapCut ya trae capturas de estudios, gráficas o textos encima. Detéctalas con `node $SK/scripts/assets.cjs overlays "$PROJ"`: escribe las ventanas en `work/overlays.json`. Confírmalas con un fotograma de cada ventana. Esas ventanas:
- **mantienen los subtítulos** (no van en `noCaptions`). Si la imagen baja de y ≈ 1100 y los subtítulos taparían sus datos, muévelos debajo con `captionMoves: [[t0, t1, 1450]]` (comprueba en el fotograma que quedan por debajo de la imagen);
- no llevan gráficos, pegatinas, zooms ni B-roll encima;
- su idea se da por ilustrada (no se repite con un gráfico propio antes ni después);
- se pueden acompañar con un whoosh suave (volumen 0,25) al aparecer.

### 3. Transcribir
`node $SK/scripts/transcribe.cjs $PROJ/work/audio.wav $PROJ/work/tx/reel.json`. Arranca y cierra el servidor de Whisper por su cuenta.
- Detecta lo que Whisper entendió mal (p. ej. "compre entrenos" por "con pre-entrenos", o "con" por "sin" cuando el sentido lo exige).
- Las líneas sueltas como "Gracias." o "¡Suscríbete!" son alucinaciones sobre ruido.

Luego ejecuta `node $SK/scripts/assets.cjs match "$PROJ"`: para cada recurso, propone los momentos en que se dicen palabras de su nombre de archivo. Los nombres suelen describir lo que se comenta, como "pesas gimnasio.mp4" o "cafe molido.jpg".

### 4. Mirar el encuadre
Saca unos 13 fotogramas repartidos del A-roll y haz una hoja de contactos (`ffmpeg ... -f concat ... -vf tile=7x2`). Anota:
- dónde están la cabeza (normalmente y ≈ 390–800) y la mesa;
- dónde están los productos y en qué lado sostiene los objetos;
- si el clip ya trae zooms de CapCut.

### 5. Escribir `$PROJ/plan.json`
Usa como plantillas `$SK/plan.example.json` (estilo base aprobado: reel "Cuánta proteína comer", ya simplificado) y `$SK/plan.broll-graficos.example.json` (sintaxis de B-roll y de todos los gráficos). Elige los tiempos con los de cada palabra.
- **Historia:** primero entiende el mensaje (gancho → problema → puntos → remate o llamada a la acción) y reparte los recursos para que acompañen cada idea, no al azar.
- **Gancho:** dos líneas de 2 a 4 palabras que resuman la promesa o el problema.
- **B-roll:** todos los recursos de la carpeta, colocados según la tabla de "Recursos de la carpeta".
- **Gráficos propios** donde validen una idea (datos, comparación, acción, advertencia o enumeración).
- **Pegatinas** de 1,1 a 1,8 s solo en los conceptos que no tengan ya recurso o gráfico en ese momento.
- **Cámara:** las rampas de `cam` no se solapan. Pon un zoom rápido en cada palabra clave fuerte y uno lento en cada explicación larga.
- **Anillos, sellos, destellos rojos, temblores y sonidos** según la emoción del momento. No amontones efectos en el mismo instante.
- **Ritmo sin saturar:** respeta el presupuesto de "MENOS ES MÁS". Los subtítulos y el presentador ya dan ritmo; cada añadido debe ganarse su sitio. El presentador se ve al menos en un 50 % del reel, y siempre en el gancho, en las frases más fuertes y en la llamada a la acción.

### 6. Generar
`node $SK/scripts/build-captions.cjs $PROJ` y después `node $SK/scripts/build-reel.cjs $PROJ`.

### 7. Comprobar
`npx hyperframes lint` y luego `npx hyperframes check`. Corrige:
- errores de `content_overlap`;
- fallos de contraste reales (un aviso en el fotograma exacto en que entra un grupo es solo la transición).

El aviso de "archivo grande, divídelo en subcomposiciones" se puede ignorar.

### 8. Fotogramas por bloque (obligatorio antes de exportar)
`npx hyperframes snapshot --at <un tiempo por bloque, por recurso, por gráfico y por efecto> --no-end -o work/snaps --timeout 20000`, y lee las hojas de contactos. Revisa:
- texto cortado o que roza los bordes;
- nada encima de la cara;
- contraste;
- efectos visibles fuera de su momento;
- un recurso mal encuadrado (ajusta `focus` o cambia el modo a `frame`);
- un gráfico vacío o pisado por los subtítulos.

Arregla lo que veas, vuelve a generar y repite las capturas solo de esos tiempos.

### 9. Render
`npx hyperframes render --fps 30 --quality delivery -o "<Nombre> - editado.mp4"` en `$PROJ`.
- Si falla con `EPERM rename`, el archivo está abierto en un reproductor: renderiza con otro nombre (`v2`, `v3`…) y avisa.
- **Masteriza el audio final:** `node $SK/scripts/master.cjs "<render>.mp4"`. Al mezclar los efectos, el render suele quedar en torno a −16 LUFS; esto lo deja en −14 LUFS con pico de −1 dBTP sin tocar la imagen (copia el vídeo tal cual).
- Verifica con `ffprobe` (1080x1920, 30/1, duración) y con `ebur128` (I ≈ −14 LUFS).
- Comunica la ruta completa, qué recursos y gráficos se usaron y dónde, cómo se cumplieron las ideas especiales, y lo que no se pudo verificar (nadie lo ha visto con sonido).

## Recursos de la carpeta (B-roll e imágenes)
- **Usa todos.** Cada clip e imagen debe aparecer al menos una vez. Si alguno no encaja con nada de lo que se dice, úsalo como plano de transición en la explicación más cercana a su tema y dilo en el resumen.
- **Dónde colocarlo:**
  1. donde se diga la palabra de su nombre (lo que devuelve `assets.cjs match`);
  2. si no coincide, por lo que muestra el fotograma.

  Empieza 0,1–0,2 s antes de la palabra y dura 1,2–3 s.
- **Modos** (campo `broll` del plan):

  | Modo | Qué hace | Cuándo usarlo |
  |---|---|---|
  | `full` | corte a pantalla completa con un punch de entrada | vídeos o imágenes verticales; el más dinámico |
  | `frame` | el recurso en una tarjeta redondeada sobre fondo azul marino | material horizontal o cuadrado (pon `aspect` = ancho/alto); no lo recortes en `full` |
  | `pip` | ventana sobre la parte de abajo (y ≈ 1330) mientras se sigue viendo al presentador | cuando él señala o reacciona a algo |

- **Ajustes:**
  - las imágenes llevan un Ken Burns automático (zoom y desplazamiento lentos);
  - `start` = segundo del clip desde el que empezar (elige la parte con más acción);
  - `focus` = encuadre del recorte (`"50% 30%"`);
  - `tag` = etiqueta corta ("CAFÉ").
- **Combinar:** alterna recursos y presentador; por ejemplo un recurso en `pip` mientras habla, o una imagen en `full` y luego un gráfico. Se pueden encadenar dos recursos seguidos si refuerzan la misma idea.
- El audio de los recursos se descarta: siempre suena la voz del A-roll.

## Gráficos propios (escenas animadas desde cero)
Añádelos cuando una idea gane fuerza con una prueba visual. Van en el campo `graphics` del plan, en modo `full` (pantalla completa, contenido en y 230–1090, con los subtítulos debajo) o `panel` (tarjeta abajo con el presentador visible).

| Idea | Tipo (`kind`) | Propiedades |
|---|---|---|
| Comparar cifras, precios o dosis | `bars` | `title`, `items: [{label, value, suffix, prefix, dec, bad}]`; las barras crecen y cuentan |
| Un dato impactante | `counter` | `value`, `from`, `prefix`, `suffix`, `dec`, `label`; el número cuenta hacia arriba |
| A frente a B (malo frente a bueno) | `versus` | `left` y `right`: `{label, emoji` o `art, bad}`; ✗ rojo en el malo, ✓ azul en el bueno |
| Una acción sin ejercicio de gimnasio (correr, cansancio, tomar café, celebrar, dudar) | `stick` | `action: run, tired, drink, celebrate o think`, `label`; muñeco de palitos genérico, sin cara |
| Un ejercicio o acción de entrenamiento concreta (levantar peso, hacer una repetición...) | `athlete` | `action: curl-swing o press-grind`, `label?`, `badge?: cross o check`; tu muñeco animado con cara (gafas, pelo, camiseta negra). **Úsalo siempre que se visualice una acción de entrenamiento o ejercicio concreto**, en vez de `stick` |
| Advertencia, prohibición, acierto, subida o bajada | `sign` | `type: warning, stop, check, cross, up o down`, `text`; señal que aparece y se balancea |
| Pasos, ingredientes o requisitos | `list` | `title`, `items`; se marcan uno a uno |
| Evolución o mejora en el tiempo | `line` | `title`, `points`, `labels: [izq, der]`, `bad`; la línea se dibuja sola |
| Comparar varias curvas (p. ej. beneficio frente a la fatiga de dos métodos) | `lines` | `title`, `leftLabels: true`, `xLabel: "Tiempo →"`, `series: [{label, points, color: blue, blue2, red o red2, at, dur?, pulse?}]`. Cada serie se dibuja en su momento (`at` = segundos desde `t0`) con su nombre **a la izquierda de la línea**. **Formato preferido por el usuario:** como mucho 3 líneas, nombres cortos ("Beneficio", "Fallo", "RIR 1-2"), sin leyenda ni series duplicadas. Separa los puntos de inicio unos 70 px para que los nombres no se pisen. Debe entenderse en un segundo |
| Intercambio, coste frente a beneficio, buscar el equilibrio | `balance` | `left` y `right`: `{label, emoji}`, `pay`, `receive`, `level` (segundos desde `t0`), `okText`; balanza: cae lo que se paga, entra lo que se recibe y se nivela con la etiqueta "EQUILIBRIO" |

- Úsalos con criterio: lo normal son 1–3 gráficos en un reel de 30–60 s, cada uno de 1,5–3 s. Durante los gráficos a pantalla completa no hay subtítulos, así que el gráfico debe entenderse solo.
- Los datos que muestren deben salir de lo que dice el vídeo o ser claramente ilustrativos. No inventes cifras como si fueran hechos: si el vídeo no da números, usa `versus`, `sign`, `stick` o `list`.
- Para un gráfico nuevo, añade un `case` en `scripts/graphics.cjs` siguiendo el mismo patrón: HTML más tweens en la línea temporal, con `immediateRender: false` en todo lo que no empiece al inicio.

## Flujo de brutos (cuando el material es en bruto)
Se usa siempre que el usuario respondió "en bruto" en el paso 0, sea 1 archivo o varios. El objetivo no es solo cortar: es construir, a partir de lo grabado, el discurso más claro, fluido y profesional posible, que se entienda a la primera por cualquier público.

1. Crea proxies 1080x1920 a 30 fps en `$PROJ/assets/clips/clipN.mp4` (`-c:v libx264 -preset veryfast -crf 18 -g 15`), numerados según el orden de los archivos de origen. Los clips del móvil pueden venir con rotación; mira un fotograma.
2. Para cada clip, extrae `work/audio/clipN.wav` y ejecuta `transcribe.cjs work/audio/clipN.wav work/tx/clipN.json 0.45`. Separar por frases es imprescindible: si se transcribe el clip entero, Whisper funde las tomas repetidas.
3. **Quita las muletillas.** En la transcripción palabra por palabra, marca y descarta relleno sin contenido: "eh", "o sea", "bueno", "vale", "tipo", titubeos y repeticiones de la misma palabra al empezar una frase ("es que, es que..."). Compruébalo de oído en los tramos dudosos: si la muletilla lleva información real pegada, no la cortes a medias.
4. **Detecta ideas repetidas.** No solo tomas idénticas: también el mismo punto explicado dos veces con otras palabras. De cada idea repetida, quédate solo con la mejor explicación (más corta, más clara, mejor dicha); descarta el resto. Puntúa las candidatas por:
   - duración (más corta = más fluida);
   - la mayor pausa interna entre palabras;
   - la probabilidad media de las palabras.

   Prefiere la toma completa y fluida, y mira un fotograma de cada candidata.
5. **Ordena las frases que sobreviven** en la secuencia más clara y profesional para explicar la idea: gancho → problema → explicación o puntos → remate o llamada a la acción (misma lógica de "Historia" del paso 5 de escritura del plan). El orden de grabación (el número de archivo) es solo una pista de partida, no una obligación: reordena si así se entiende mejor, se gana fluidez o suena más profesional. Que el resultado final sea comprensible para cualquier público, no solo para quien ya conoce el tema.
6. Escribe `work/edl.json` (`[{clip, s, e, line}]`) con el orden final del punto 5, con 0,06 s de margen antes y 0,12 s después de cada frase, y construye el corte con `node $SK/scripts/build-cut.cjs $PROJ`.
7. Quita las pausas internas (`silencedetect=noise=-33dB:d=0.28` sobre `assets/reel.mp4`) partiendo esa entrada del edl en piezas con el mismo `line`. Vuelve a ejecutar `build-cut`.
8. Añade en `cam` un keyframe `[t, 1.0 o 1.08 alternando, 0, "none"]` en cada corte (están en `work/tx/words.json` → `cuts`). Luego ejecuta `assets.cjs match`; tanto `match` como `build-captions` usan `work/tx/words.json` automáticamente.

## Esquema de `plan.json`
| Campo | Formato |
|---|---|
| `video`, `duration`, `volume` | ruta del A-roll, segundos, volumen (1,0 tras `enhance.cjs`; 0,9 sin él) |
| `grade` | **no se usa por defecto** (no se retoca ni regrada la imagen); solo si el usuario pide expresamente un tratamiento de color en las ideas especiales del paso 0 |
| `bgm` | `{src, volume}` música de fondo instrumental sin voz, siempre discreta (volumen ≈ 0,12); clásica, alegre, melódica y sencilla. Resuelta vía `media-use resolve --type bgm` (sin copyright) |
| `faceOriginY` | origen del zoom a la altura de la cara (`"29%"`) |
| `captionsTop` | y de los subtítulos (1140 px) |
| `hook` | `{t1: 2.0, l1, l2, theme?}`; por defecto azul, que es el preferido; `theme: "red"` solo si el usuario lo pide |
| `fixes` | `[[de, a, palabraAnteriorEmpiezaPor?]]` correcciones de Whisper; `a` = `""` borra la palabra |
| `keywords` | palabras en azul con salto más fuerte |
| `noCaptions` | `[[t0, t1]]` tramos extra sin subtítulos, solo si el usuario lo pide o si hay otro texto animado propio que repite lo que se dice. Nunca para las imágenes del usuario. |
| `hideCaptionsOnHook` | `false` para mostrar subtítulos durante el gancho (por defecto se ocultan) |
| `broll` | `[{t0, t1, src: "assets/media/…", mode: full, frame o pip, start?, aspect?, focus?, kb?, tag?, quiet?, hideCaptions?}]` |
| `graphics` | `[{t0, t1, kind, mode: full o panel, keepCaptions?, …props}]` (ver la tabla de gráficos; en `full` se ocultan los subtítulos salvo con `keepCaptions: true`) |
| `stickers` | `[t0, t1, arte, "L" o "R", etiqueta]`; arte = clave de `art.cjs`, `emoji:assets/emoji/<código>.svg` o `img:<ruta>` |
| `cam` | `[t, escala, duraciónRampa, ease]`; la rampa termina en `t`; 0 = cambio seco |
| `shakes` | `[t, fuerza px]` (9–14) |
| `flashes` | `[t, opacidad]` destello blanco |
| `rings` | `[t]` anillo azul desde los subtítulos |
| `reds` / `capShakes` | `[t]` destello rojo / temblor de los subtítulos (momentos negativos) |
| `autoWhoosh` / `autoPop` | archivo (sin `.mp3`) del whoosh automático al entrar cada gráfico o B-roll y del pop de cada pegatina. Por defecto `whoosh-short` y `pop`, que son los que prefiere el usuario |
| `stamps` | `[t, texto, duración]` sello gigante ("2", "+1", "RIR 1-2"); el tamaño se reduce solo según la longitud del texto para que no se salga del encuadre |
| `callouts` | `[{t0, t1, text, icon: "cross", "check" o "warning", top?: 1120, textAt?}]` frase grande centrada con icono que entra de golpe: primero el icono en `t0` y luego el texto en `textAt`. El tamaño se ajusta solo a la longitud del texto. Oculta los subtítulos durante su tramo. Úsalo para la frase clave del momento de énfasis |
| `iconRow` | `{items: [{emoji, label}], top?: 1060, shows: [{t0, t1, reveal}]}`: fila de iconos para enumeraciones. `reveal: 0` los muestra todos difuminados con "?". `reveal: n` descubre el n-ésimo (de difuminado a nítido, destacado y con etiqueta) y deja nítidos los anteriores. Oculta los subtítulos en cada `show`. Ejemplo: "3 tipos de fallo" → ⚠️ Técnico, 💪 Muscular, 🧠 Psicológico |
| `captionMoves` | `[[t0, t1, top]]` mueve los subtítulos a otra altura en ese tramo (p. ej. 1450 bajo una gráfica del usuario que llega a y ≈ 1370) |
| `sfx` | `[id, archivo, inicio, duración, volumen, inicioEnElArchivo]`; el riser se recorta con inicioEnElArchivo ≈ 7–8,5 para que termine en el golpe |

**Dibujos disponibles** (`art.cjs`, sirven para pegatinas y para `versus`): banana, dumbbell, carbs, glycogen, caffeine, coffee, brain, duo (plátano + café), flask. Añade más dibujos SVG planos (200x200) cuando haga falta.

**Emojis:**
- Ya incluidos en `assets/emoji`: 1faab 🪫, 26a1 ⚡, 1f4aa 💪, 2615 ☕, 1f34c 🍌, 1f525 🔥, 1f4b0 💰, 1f4b8 💸, 274c ❌, 2705 ✅, 1f4a5 💥, 26a0 ⚠️, 1f9e0 🧠, 1f623 😣, 1f465 👥, 1f514 🔔, 1f635 😵, 1f52c 🔬, 1f4c9 📉, 1f357 🍗.
- Otro emoji: `curl -sL -o $PROJ/assets/emoji/<código>.svg https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/<código>.svg`.
- No uses fuentes de emoji: el renderizador no las tiene.

**Efectos de sonido** (`assets/sfx`, mp3; duración entre paréntesis):

| Uso | Archivos |
|---|---|
| Golpes y revelaciones | impact-bass-1 (2,1 s), impact-bass-2 (2,6 s), impact-boom-sfx-air-effect-2 (4 s, recórtalo a 1,5–1,8 s), impact-sub-rush-2 (2,7 s) |
| Golpes secos (sellos, caídas) | drop-medium-thud-1 (0,74 s), drop-ani-big-pipe-hit (1 s) |
| Transiciones | whoosh, whoosh-short (0,57 s), whoosh-cinematic (5,5 s), whoosh-space-swoosh-brighter (0,98 s), whoosh-swosh-swoosh-whoosh-air-soun (0,49 s), whoosh-swoosh-15-windy (0,4 s) |
| Tensión y suspense | riser (10 s, recórtalo), tension-rising-tone-wav (2,2 s), tension-sfx-thrilling-build-up-and-h (3,5 s, acaba en golpe), heartbeat-single-heartbeat-clean-hq-be (0,66 s), heartbeat-four-heartbeats-hq-beatsmith (3,6 s) |
| Positivo y logro | chime (2,5 s), sparkle (1,8 s), ping (1,3 s), notification (2,5 s), positive-level-up-sfx-1 (1,1 s), positive-fantasy-ui-button-3-wav (1,3 s) |
| Dinero, pagar o ganar | coin-coin-dropped (0,29 s), coin-coin-drop-on-concrete (1,5 s), coin-cash-register (0,96 s) |
| Negativo | error (1,6 s), negative-wrong-answer (1,05 s), negative-buzzer2-wav (1,3 s), glitch-1/2/3 (2,6–3,5 s, recórtalos a 0,7–1,2 s) |
| Interfaz y pops | pop (0,72 s), pop-sci-fi-bubble-pop (0,49 s), pop-the-best-bubble-pop-sound-fo (0,26 s), click, click-soft, key-press, typing |

Los sonidos con prefijo de categoría (`impact-`, `tension-`, `coin-`…) son CC0, descargados de Openverse/freesound (créditos en `assets/sfx/credits.json`). **Solo se usan si el usuario pide sonidos nuevos**: por defecto, los clásicos.

## Problemas conocidos
- **Animaciones visibles antes de tiempo:** en GSAP, `fromTo` pinta su estado inicial en cuanto se crea. Todo efecto que no empiece en t=0 lleva `immediateRender: false`; los scripts ya lo hacen, mantenlo en lo que añadas.
- **Subtítulos pegados:** si Whisper aprieta varias palabras en 0,05 s, la entrada puede durar más que el grupo y dejarlo en pantalla. Por eso el script fusiona los grupos de menos de 0,45 s y limita la entrada a la mitad de su duración.
- **Vídeo dentro de otro elemento con tiempo:** HyperFrames no admite un `<video>` con `data-start` dentro de otro elemento con `data-start`. Los B-roll ya van en contenedores sin tiempo; los gráficos no llevan `data-start` y se muestran y ocultan solo con opacidad.
- **Volumen bajado al renderizar:** HyperFrames baja el audio si hay picos ("Audio lowered by X dB"). Es normal.
- **Procesos:** no cierres procesos `node.exe` en bloque, porque pueden ser del usuario. Cierra solo por PID.
- **Logos reales**, si el usuario los pide expresamente: `npx hyperframes media-use resolve --type logo --entity <marca> --project .`.
