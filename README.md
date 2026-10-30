# 🎬 Edita reels de fitness con Claude (guía paso a paso)

Con esta guía vas a poder **montar reels verticales** (TikTok, Reels, Shorts) casi solo con pedírselo a Claude: te pone subtítulos grandes, zooms, gráficos animados, efectos de sonido y música, y te saca el vídeo ya terminado.

No hace falta saber programar. Solo copiar y pegar los comandos de esta guía, uno a uno.

> **Qué estás instalando (en palabras simples)**
> - **Claude Code**: el asistente de Anthropic que vive en tu ordenador y hace el trabajo.
> - **HyperFrames**: la "máquina" que construye y exporta el vídeo. Se instala como *plugin* de Claude.
> - **La skill `editar-reel-fitness`**: las "instrucciones de estilo" que le enseñan a Claude a editar reels de fitness. Es lo que hay en la carpeta `skills/` de este repositorio.

---

## ✅ Antes de empezar: lo que necesitas

| Qué | Para qué | Cómo conseguirlo |
|---|---|---|
| Una cuenta de Claude de pago (Pro o superior) | Usar Claude Code | https://claude.com |
| **Claude Code** | El asistente | https://claude.com/claude-code (sigue su instalación) |
| **Node.js** (versión 22 o más nueva) | Hace funcionar HyperFrames | https://nodejs.org (descarga la versión "LTS" más reciente) |
| **Git** | Para descargar esta skill | https://git-scm.com/downloads |
| **FFmpeg** | Corta, mezcla y exporta el vídeo | Paso 1 de esta guía |
| **Whisper** | Escribe automáticamente lo que dices (subtítulos) | Paso 2 de esta guía |

Tiempo estimado: **20–30 minutos** (la mayoría es esperar descargas).

---

## 🪜 Paso 1 · Instalar FFmpeg y Whisper

Abre **PowerShell** (en Windows: botón Inicio → escribe `PowerShell` → Enter).

### Windows

Primero instala *Scoop* (un "instalador de programas" muy cómodo). Pega estas dos líneas, una por una:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

```powershell
irm get.scoop.sh | iex
```

Ahora instala FFmpeg y Whisper:

```powershell
scoop install ffmpeg
```

```powershell
scoop install whisper-cpp
```

### Mac

```bash
brew install ffmpeg whisper-cpp
```

(Si no tienes `brew`, instálalo desde https://brew.sh)

---

## 🪜 Paso 2 · Descargar el "cerebro" de Whisper

Whisper necesita un archivo de modelo (pesa **aprox. 1,6 GB**, así que tarda un poco).

### Windows (PowerShell)

```powershell
New-Item -ItemType Directory -Force "$HOME\.cache\hyperframes\whisper\models"
```

```powershell
curl.exe -L -o "$HOME\.cache\hyperframes\whisper\models\ggml-large-v3-turbo.bin" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

### Mac

```bash
mkdir -p ~/.cache/hyperframes/whisper/models
curl -L -o ~/.cache/hyperframes/whisper/models/ggml-large-v3-turbo.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
```

⚠️ Es importante que el archivo quede **exactamente en esa carpeta y con ese nombre**: la skill lo busca ahí.

---

## 🪜 Paso 3 · Instalar el plugin de HyperFrames

Esto le da a Claude la capacidad de crear y exportar vídeos.

En la misma ventana de PowerShell (o Terminal en Mac), pega estas dos líneas:

```bash
claude plugin marketplace add heygen-com/hyperframes
```

```bash
claude plugin install hyperframes@hyperframes
```

La primera línea "da de alta la tienda" de HyperFrames y la segunda instala el plugin.

**Para comprobar que funcionó:** escribe `claude` y pulsa Enter. Dentro de Claude, escribe `/hyperframes` y deberías ver el comando disponible. Para salir, escribe `/exit`.

---

## 🪜 Paso 4 · Instalar la skill `editar-reel-fitness`

Descarga este repositorio y copia la carpeta de la skill a la carpeta de skills de Claude.

### Windows (PowerShell)

```powershell
git clone https://github.com/francisco13021998/reel-fitness-skill.git
```

```powershell
New-Item -ItemType Directory -Force "$HOME\.claude\skills"
```

```powershell
Copy-Item -Recurse -Force reel-fitness-skill\skills\editar-reel-fitness "$HOME\.claude\skills\"
```

### Mac

```bash
git clone https://github.com/francisco13021998/reel-fitness-skill.git
mkdir -p ~/.claude/skills
cp -r reel-fitness-skill/skills/editar-reel-fitness ~/.claude/skills/
```

**Para comprobar que funcionó:** abre `claude` y escribe `/editar-reel-fitness`. Si aparece, ya está lista. (Si no aparece, cierra Claude con `/exit` y vuelve a abrirlo.)

---

## 🪜 Paso 5 · Revisar que todo está bien (opcional pero recomendable)

Dentro de Claude Code puedes pedirle:

> *"Ejecuta `npx hyperframes doctor` y dime si falta algo para editar vídeos."*

Claude revisará tu ordenador y te dirá si hay algo por arreglar.

---

## 🎥 Cómo se usa

1. **Mete en una carpeta** tu vídeo hablando a cámara y todos los extras que quieras usar (otros clips, imágenes, capturas...).
2. Abre una terminal **dentro de esa carpeta** y escribe `claude`.
3. Pídele, por ejemplo:

   > *"Edita un reel de fitness con la skill editar-reel-fitness"*

4. Claude te hará **3 preguntas rápidas**:
   - ¿En qué carpeta están los vídeos e imágenes?
   - ¿Quieres alguna idea o característica especial?
   - ¿Los clips están en bruto (con repeticiones) o ya limpios?
5. **Espera** mientras monta y exporta. Al terminar tendrás un archivo `... - editado.mp4` en la carpeta del proyecto.

### Qué hace por ti

- ✂️ Subtítulos grandes en el centro, con las palabras clave en azul
- 🪝 Gancho de apertura con texto grande en los primeros 2 segundos
- 🔍 Zooms, destellos y efectos de sonido
- 📊 Gráficos animados (barras, contadores, comparativas, muñecos haciendo ejercicio)
- 🖼️ Usa todos los clips e imágenes que le des
- 🎵 Música de fondo sin copyright

> 💡 **Nota:** el estilo viene pensado para el canal de Paco (colores azules, muñeco con gafas y camiseta negra...). Si quieres otro estilo, dile a Claude: *"Cambia el color a verde"* o *"el muñeco que lleve gorra"*. Puede modificar su copia de la skill (`~/.claude/skills/editar-reel-fitness/SKILL.md`) a tu gusto.

---

## 🆘 Si algo falla

| Problema | Solución |
|---|---|
| `claude` no se reconoce | Cierra y vuelve a abrir la terminal. Si sigue igual, reinstala Claude Code. |
| `node` o `npx` no se reconocen | Instala Node.js (versión 22+) y reinicia la terminal. Comprueba con `node -v`. |
| `scoop` no se reconoce | Cierra y abre PowerShell de nuevo. |
| No aparece `/editar-reel-fitness` | Revisa que exista la carpeta `~/.claude/skills/editar-reel-fitness` con el archivo `SKILL.md` dentro. Reinicia Claude. |
| Los subtítulos no se generan | Revisa que el modelo de Whisper esté en `~/.cache/hyperframes/whisper/models/ggml-large-v3-turbo.bin` (Paso 2). |
| Falla al exportar el vídeo | Pídele a Claude: *"Ejecuta `npx hyperframes doctor` y arregla lo que falte."* |

---

## 🔄 Actualizar más adelante

- **Plugin HyperFrames:** `claude plugin update hyperframes@hyperframes`
- **Esta skill:** entra en la carpeta `reel-fitness-skill`, ejecuta `git pull` y vuelve a copiar la carpeta como en el Paso 4.

---

## 📜 Créditos y licencias

- **HyperFrames** es de HeyGen (licencia Apache-2.0): https://github.com/heygen-com/hyperframes
- Los efectos de sonido de `skills/editar-reel-fitness/assets/sfx` incluyen su autor y licencia (CC0) en `credits.json`.
- Los emojis son de Twemoji.
