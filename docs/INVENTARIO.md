# INVENTARIO — Disco de modelos (HDD 2TB) y SSD de sistema

> **Este archivo es la fuente de verdad** de dónde está cada cosa en esta máquina.
> Cualquier cambio (mover, añadir, borrar, actualizar) en `/mnt/models`, los symlinks,
> el home o los repos descritos aquí **debe registrarse en la sección correspondiente** (§8).
> Última revisión completa: **2026-10-19** (auditoría contra el estado real); actualización parcial **2026-10-20**: skills de OpenCode movidas al HDD con symlink, + skill `3dviz-pro-max` y dependencias opcionales (Playwright, pnpm, Blender) instaladas en el HDD (§8).
> **Auditoría completa **2026-10-28**: se eliminaron las carpetas inlinea-rea (169 MB) y inlinea-reconstruido (14 MB) —ambas no documentadas, proyecto de ingeniería inversa a Moodle—; se documentó la carpeta raíz nueva `strata/` (64 GB, proyecto MTP/coder en progreso) y `tools/llama.cpp-flint/`; 2 GGUF nuevos (`Spark-X2.6-4B-Q8_0`, `flint-UD-Q4_K_XL`); el hub HF pasó de 9→13 modelos / 46→89 GB; y se reportó el symlink `~/.local/bin/ft` como roto (dangling, §3). **2026-10-28 (segunda ronda):** se eliminaron los pesos `vllm/Qwen3.6-35B-A3B-NVFP4/` (22 GB) y `freetoken/Qwen3.6-35B-A3B-NVFP4-ftw/` (21 GB) y se retiraron del árbol (§2); el motor FreeToken CLI (`.venvs/freetoken`, 6,8 GB) se eliminó.
> **2026-10-31:** `npm` global movido al HDD: `/mnt/models/tools/npm-global/` (prefix en `~/.npmrc`, PATH en `~/.bashrc`); paquete `@earendil-works/pi-coding-agent` v1.4.0 instalado; symlink `~/.local/bin/pi-coding-agent` → `tools/npm-global/bin/pi` (§2, §3). Antigua `~/.npm-global` del SSD eliminada (~250 MB liberados).
> **2026-11-01:** Eliminación masiva: GGUF `liquid/LFM2.5-24B-A2B-QAD-Q4_0` (13,6 GB) y `Spark-X2.6-4B-Q8_0` (4,1 GB); proyecto `strata/` (~64 GB); 5 repos del hub HF (`MiniMax-H3`, `MiniMax-H3-FP8`, `Nemotron-3.5-Bolt-74B-A9B-GGUF` + variante BF16, `Ornith-1.5-122B`, `LTX-2.5-FP8`) con purga de blobs huérfanos (hub pasó de 114 GB a ~140 KB). HDD: 359→228 GB usados (≈131 GB liberados).
> **2026-11-01 (2.ª ronda):** el resto de GGUF sueltos (§2) también se eliminó y el directorio `gguf/` desapareció por completo (Qwen3.8-27B, Huihui, Swift, Ornith-1.5-35B, flint-UD, Nemotron-E4B). Re-descargado `InternScience/Sage-A1.5-Q4_K_M-GGUF` con `hf download --include "Sage-A1.5-Q4_K_M.gguf" --local-dir` (21,7 GB, SHA-256 validado por el CLI); recreado `/mnt/models/gguf/`. El `mmproj` de visión NO se descargó (el script usa `--no-mmproj`). HDD re-medido: 129 GB / 1,6 T libres (8 %).
> **2026-11-01 (3.ª ronda, auditoría completa):** documentados como no documentados antes: `awq/` (18 GB: Nemotron-3.5-Bolt-E4B-W4A16 + gemma-4-E4B-it-AWQ, safetensors), `raw/NVIDIA-Nemotron-3.5-Bolt-E4B-BF16/` (15 GB), `tools/venv-quant/` (11 GB) y `tools/venv-rag/` (1,4 GB). Corregido: en el hub NO queda ningún GGUF real (el de Nemotron-E4B-4GB es un **symlink roto** a blob purgado); `~/.unsloth/` del SSD pesa 11 GB; scripts de arranque de `~/` con su estado (⛔ solo `start_sage_server_fast.sh` tiene modelo); `~/.local/bin/ft` ya no existe (limpiado); SSD re-medido 76 GB / 27 G libres. §2 tree re-escrito; §3 home y scripts actualizados; §8 tamaños re-medidos.
> **2026-11-01 (4.ª ronda):** re-descargado `ornith-ai/Ornith-1.5-35B-A3B-GGUF` → `gguf/Ornith-1.5-35B-Q4_K_M.gguf` (21,7 GB, SHA-256 validado por el CLI; solo pesos, mmproj de visión NO descargado). HDD: 149 GB / 1,6 T (9 %). Segundo GGUF en `gguf/`, junto a `Sage-A1.5-Q4_K_M.gguf`. Scripts Ornith de `~/` vuelven a estar operativos (§3).

## 1. Discos (medido 2026-10-19; re-medido 2026-11-01)

| Disco | Modelo | Montado | Uso / Libre |
|---|---|---|---|
| `sda` | WDC WD22PURZ, 2 TB (1,8T visibles) | `/mnt/models` | 149 GB (9 %) / 1,6 T |
| `sdc` | ADATA SU650, 120 GB (107G LVM) | `/` (LVM), `/boot`, `/boot/efi` | 76 GB (75 %) / 27 G |
| `sdb` | ST2000DM008, 2 TB | ⛔ sin montar — **Windows** | — |
| `sdd` | WD Green 2.5", 1 TB | ⛔ sin montar — **Windows** | — |
| `sde` | — (0 B) | fantasma, sin uso | — |

> Solo se usan `sda` y el SSD de sistema; a `sdb`/`sdd` no se les monta, formatea ni toca.
> Historia: 2026-10-17 se migraron el `build/` (40 GB) y el artefacto de modelo de
> `ninfer-5070ti` del SSD al HDD; desde entonces el HDD sumó +46 GB por descargas HF (§2).
> 2026-10-20: +~2,2 GB (skill `3dviz-pro-max` + Playwright + pnpm + Blender, §8/§8.1).
> 2026-10-28: +~148 GB (≈24 GB `flint-UD-Q4_K_XL.gguf` + ≈11 GB blobs HF nuevos + `strata/` 64 GB en progreso + demás descargas); el hub HF creció 46→89 GB.

## 2. Estructura de `/mnt/models` (HDD)

```
/mnt/models/
├── gguf/                         🧠 GGUF sueltos (llama.cpp) — recreado el 2026-11-01 tras quedar vacío
│   ├── Sage-A1.5-Q4_K_M.gguf                             21,7 GB  (MoE qwen35moe ~35B / 3B activos; solo pesos, sin mmproj de visión)
│   └── Ornith-1.5-35B-Q4_K_M.gguf                        21,7 GB  (MoE qwen3_5_moe 35B-A3B; re-descargado 2026-11-01; solo pesos, sin mmproj)
├── huggingface/                  📥 caché HF/Unsloth (HF_HOME)
│   ├── hub/                     models--org/nombre/ (13 repos, solo metadata y blobs pequeños; ~26 MB; §2.1)
│   └── xet/                     caché XET (11 MB)
├── awq/                          🧠 pesos AWQ (safetensors) — 18 GB   🆕 (2026-10-29/30, no documentado antes)
│   ├── Nemotron-3.5-Bolt-E4B-W4A16/     8,7 GB (cuantizado en local — scripts `quantize_bolt_w4a16.py` en home)
│   └── gemma-4-E4B-it-AWQ/              8,7 GB (safetensors)
├── raw/                          🧠 pesos BF16 (safetensors) — 15 GB   🆕 (2026-10-29, no documentado antes)
│   └── NVIDIA-Nemotron-3.5-Bolt-E4B-BF16/
├── tools/                        🔧 herramientas y runtimes (total ~24 GB)
│   ├── npm-global/              📦 npm global en HDD (405 MB; prefix configurado); `pi-coding-agent` v1.4.0 → §3 + §8.2
│   ├── llama-akv/               fork "adaptive-kv-streaming" (568 MB); build-v2/bin/llama-server (CUDA 13)
│   ├── venv-quant/              🐍 venv Python de cuantización (torch, vllm, triton, flashinfer, tilelang, auto-round; 11 GB)   🆕 (no documentado antes)
│   ├── cuda13/staging/          runtime CUDA 13.4 (~7,8 GB; `usr/local/cuda-13.4` sola: 5,2 GB)
│   ├── llama.cpp-pruebas/       vainilla (ggml-org; 827 MB); build/bin/llama-server (v0.5.0-dev)
│   ├── llama.cpp-flint/         build para `flint-UD-Q4_K_XL.gguf` (305 MB)   🆕 (2026-10-24)
│   ├── venv-rag/                🐍 venv Python RAG/embeddings (torch, transformers, scipy, hub; python3.14; 1,4 GB)   🆕 (no documentado antes)
│   ├── opencode-skills/         skills de OpenCode (8, 17 MB) → §8
│   ├── playwright/              venv + Chromium headless (837 MB) → §8.1
│   ├── pnpm/                    pnpm 12.14.0 (60 MB) → §8.1
│   └── blender/                 Blender 5.2.2 LTS (1,2 GB) → §8.1
├── ninfer-5070ti-build/build/     🧪 build de NInfer-5070Ti (40 GB, no trackeado) → §6
├── ninfer-5070ti-models/models/   🧪 qwen3_8_27b_gsq3.ninfer (13,3 GB) → §6
└── ninfer/                     (vacía; destino del symlink `ninfer-5070ti/models`)
```

- Cachés de descarga (autogenerados): `gguf/.cache/`, `.cache/huggingface/` (8,8 GB en SSD — solo metadatos), `~/.cache/uv/` (32 GB, Python packages). Se borró `gguf/liquid/.cache/`.
- `huggingface/hub/` (13 modelos, verificado 2026-11-01): `BAAI/bge-m3`, `BAAI/bge-reranker-v2-m3`, `InternScience/Sage-A1.5-Q4_K_M-GGUF` (metadata; el GGUF pesado vive en `gguf/`), `Lightricks/LTX-2.5-Diffusers`, `Qwen/Qwen3-Embedding-0.6B`, `Qwen/Qwen3-Reranker-0.6B`, `XHToken/Spark-X2.6-4B-GGUF` (solo metadata), `google/embeddinggemma-300m`, `intfloat/multilingual-e5-large-instruct`, `intfloat/multilingual-e5-small`, `nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB` (❌ symlink roto — solo snapshot, el blob fue purgado), `unsloth/bge-small-en-v1.5`, `unsloth/flint-GGUF` (metadata). **En el hub NO queda ningún GGUF real** (total ≈26 MB). **Ya no existen** (eliminados 2026-11-01 y previos): `MiniMaxAI/MiniMax-H3`, `unsloth/MiniMax-H3-FP8`, `unsloth/NVIDIA-Nemotron-3.5-Bolt-74B-A9B-GGUF` (+BF16), `unsloth/Ornith-1.5-122B-GGUF`, `unsloth/LTX-2.5-FP8`, `Qwen/Qwen-Image-*`, `morikomorizz/Pony-Diffusion-V6-XL-GGUF`.

**Nota de modelo.** `liquid/LFM2.5-24B-A2B-QAD-Q4_0.gguf` — ~~Liquid AI~~ **ELIMINADO 2026-11-01** (ver §2.1). Era: MoE 24B (2,45B activos), 64 expertos top-4, contexto **131 072**, vocab 128K, 16 idiomas, razonamiento `<think>`, licencia `lfm1.0`. Muestreo oficial: `temp 0.1 · top_k 50 · repeat-penalty 1.05`. Cabía en el 5070 Ti 16 GB con KV `q8_0` (~14,7 GiB). SHA-256: `d1c03f73ecaf61017d70419eec9e5dc0b05d522829b934fbabf8a5` (verificado 2026-10-19).

## 2.1 Limpieza 2026-11-01 (estrategia de espacio)

- **Eliminados del HDD:** `liquid/LFM2.5-24B-A2B-QAD-Q4_0.gguf` (13,6 GB), `Spark-X2.6-4B-Q8_0.gguf` (4,1 GB), `strata/` (~64 GB).
- **Eliminados del hub HF:** `MiniMaxAI/MiniMax-H3`, `unsloth/MiniMax-H3-FP8`, `unsloth/NVIDIA-Nemotron-3.5-Bolt-74B-A9B-GGUF` (incluye variante BF16), `unsloth/Ornith-1.5-122B-GGUF`, `unsloth/LTX-2.5-FP8`. Los blobs de estos fueron huérfanos y se purgaron; el hub quedó en ≈9 modelos con solo metadatos (~140 KB) en ese momento; ese mismo día acabó con 13 repos de metadata (~26 MB) tras las re-bajas — lista actual en §2.
- **Eliminados de la SSD:** metadata `~/.cache/huggingface/hub/models--nvidia--NVIDIA-Nemotron-3.5-Bolt-E4B-BF16/` (sin datos reales).
- **Espacio liberado total:** ~131 GB en el HDD (`strata/` fue la mayor contribución, 64 GB; hub HF pasó de 114 GB a 140 KB).

## 3. Home (`/home/aficado`) y symlinks

- `INVENTARIO.md` — este archivo (vive en `clinica-bienestar/docs/` desde 2026-10-15).
- `README-benchmarks-inferencia-local.md`, `local-ai-research-2026.md` / `-es.md` — docs de benchmarks/investigación.
- Config y cachés: `.opencode/` (su `skills/` es un symlink al HDD → §8), `.local/`, `.cache/` (`.cache/huggingface/`: 8,8 GB metadatos; `.cache/uv/`: 32 GB), `.npm/` (caché npm, 1,7 GB — el *prefix* global está en el HDD, §2), `.hf-cli/` (48 M), `.claude/`, `.ssh/`, `.agents/`, `.triton/`, `.unsloth/` (**11 GB en SSD**: Unsloth Studio 8,5 GB + llama.cpp 498 MB + stable-diffusion.cpp 376 MB + whisper.cpp 279 MB), `.nv/` (975 M), `.tilelang/`, `.venv-gguf/` (92 M).
- `ninfer-5070ti/` — repo git (§6). `clinica-bienestar/` — web de la clínica (§7).
- Proyectos personales: `mi-video/` (802 M), `voltnode/` (+ `voltnode-hosting.html`), `social/` (+ `social-feed.html`), `analisis-colima-saas/` (+ `analisis-mercado-colima-saas-ia-2026.md`), `casaos-reconstruction/` (53 M) y `casaos-reconstruido/` (61 M) — reconstrucción de CasaOS, `sakura-house/` (54 M), `sakura-cabin/` (1,2 M), `rag_eval/` (5,5 M), `investigacion/` (16 K).   🆕 (2026-10/11, no documentados antes)
- Suelto: `tienda_comandos.md`, `practica_sql.sql`, `examen.sql`, `fix_swift.sh`, `swift.jinja`, `compactar.js`, `test.txt`, `serve.log` (0 B), `plan-instalacion-magicaVoxel.md`, `qwen3.7-30b-open.html`, `ornith1.5-122B-A10B.sh`, `package-lock.json`; cuantización AWQ: `quantize_bolt_w4a16.py`, `download_gemma4_awq.py` (+ logs `quantize_awq.log`, `download_bf16.log`, `download_gemma4_awq.log`); benchmarks/tests: `benchmark_16_rag.py`, `benchmark_16x5.py` (+ `benchmark_16x5_report.json`), `quality_concurrency_16x3.py` (+ `quality_16x3_report.json`); logs `vllm.log`, `server_16p.log`, `llama-swift.log`, `unsloth-studio.log`, `ornith.log`.

**Symlinks `~/` → HDD:**

| Symlink | Apunta a |
|---|---|
| `models` | `/mnt/models` |
| `llama-akv` | `/mnt/models/tools/llama-akv` |
| `cuda13` | `/mnt/models/tools/cuda13` |
| `ninfer-5070ti/build` | `/mnt/models/ninfer-5070ti-build/build` |
| `ninfer-5070ti/scripts/models` | `/mnt/models/ninfer-5070ti-models/models` |
| `ninfer-5070ti/models` | `/mnt/models/ninfer` (vacía) |
| `.opencode/skills` | `/mnt/models/tools/opencode-skills` (skills de OpenCode; §8) |

**Symlinks `~/.local/bin/` → HDD (2026-10-20):**

| Symlink | Apunta a |
|---|---|
| `blender` | `/mnt/models/tools/blender/blender-5.2.2-linux-x64/blender` |
| `pnpm` (y `pn`, `pnpx`, `pnx`) | `/mnt/models/tools/pnpm/bin/` |
| `pw3d` | `/mnt/models/tools/playwright/bin/pw3d` (wrapper del venv Playwright) |
| `pi-coding-agent` | `/mnt/models/tools/npm-global/bin/pi` (v1.4.0; npm global en HDD, §2) |

> **2026-10-28 — no documentados en esta tabla pero presentes:** symlinks `strata` (`~/.local/share/strata/terminal/current/bin/strata`; **aún existe** aunque el proyecto `/mnt/models/strata` se eliminó 2026-11-01 — el CLI vive en `~/.local/share/strata/`, 1,4 GB), `unsloth` (`~/.unsloth/studio/.../bin/unsloth`), `hf` (`~/.hf-cli/venv/bin/hf`), `python3.12` (uv), y los binarios `cloudflared`, `uv`, `uvx`. El symlink roto `~/.local/bin/ft` reportado el 2026-10-28 **ya no existe** (limpiado).

**Scripts de arranque (en `~/`)** — llama.cpp vainilla, puerto 8080, modelo en `/mnt/models/gguf/`.
> Estado 2026-11-01: **funcionan** `start_sage_server_fast.sh` y los 3 de Ornith (modelos re-descargados); el resto apuntan a GGUF eliminados en la limpieza (⛔).

| Script | Modelo | Flags clave |
|---|---|---|
| `start_sage_server_fast.sh` | `Sage-A1.5-Q4_K_M` | ✅ **funciona** — modelo re-descargado 2026-11-01 · ctx 256k (262k), `--fit on --fit-target 512`, `--cpu-moe`, KV q8_0/q4_0, `--no-mmproj` (visión desactivada), reasoning deepseek, API key |
| `start_qwen_server.sh` | `Qwen3.8-27B-UD-IQ4_XS` | ⛔ sin modelo · ctx 64k |
| `run-huihui-qwen3.8-27b.sh` | `Huihui-…-abliterated-UD-IQ4_XS` | ⛔ sin modelo · check de VRAM |
| `start_swift_server.sh` | `Swift-1.5-…-GSQ-RCO-IQ3_S-mtp` | ⛔ sin modelo · ctx 128k, KV q8_0/q4_0 |
| `start_lfm_server.sh` | `liquid/LFM2.5-24B-A2B-QAD-Q4_0` | ⛔ sin modelo · ctx 131k, muestreo oficial, reasoning 8192 |
| `start_ornith_server.sh` | `Ornith-1.5-35B-Q4_K_M` | ✅ **funciona** — re-descargado 2026-11-01 · ctx 128k, `--cpu-moe`, flash-attn (no arrancar con Swift) |
| `start_ornith_server_fast.sh` | idem Ornith | ✅ **funciona** — re-descargado 2026-11-01 · `--fit on --fit-target 512` (auto-reparto de expertos), reasoning 2048, API key |
| `start_ornith_server_256k.sh` | idem Ornith | ✅ **funciona** — re-descargado 2026-11-01 · ctx 256k |
| `start_flint_server.sh` / `_fast.sh` | `flint-UD-Q4_K_XL` | ⛔ sin modelo · usa build `tools/llama.cpp-flint` |
| `start_spark_server.sh` | `Spark-X2.6-4B-Q8_0` | ⛔ sin modelo · MoE 4B |
| `start_nemotron_bolt_server.sh` | `Nemotron-3.5-Bolt-E4B-Q4_K_M` | ⛔ sin modelo (hub: symlink roto; hay Safetensors en `awq/` y `raw/`) · ctx 64k, `--cpu-moe` |
| `start_server_16p.sh` | idem Nemotron-Bolt | ⛔ sin modelo · ctx 64k, `--parallel 16`, KV q8_0 (tests de concurrencia) |
| `start_strata_coder.sh` | Strata + `Qwen3.8-Flash-Next Coder IQ1_M` | ⛔ sin modelo (`/mnt/models/strata` eliminado 2026-11-01; el CLI strata sigue instalado, §3) |

## 4. Cómo arrancar cosas (recetario)

```bash
# a) llama.cpp vainilla
export LD_LIBRARY_PATH=/mnt/models/tools/llama.cpp-pruebas/build/bin
/mnt/models/tools/llama.cpp-pruebas/build/bin/llama-server -m /mnt/models/gguf/TU-MODELO.gguf

# b) llama-akv (fork) — necesita el runtime CUDA 13
export LD_LIBRARY_PATH=/mnt/models/tools/cuda13/staging/usr/local/cuda-13.4/targets/x86_64-linux/lib
/mnt/models/tools/llama-akv/build-v2/bin/llama-server -m /mnt/models/gguf/TU-MODELO.gguf

# c) NInfer 5070 Ti (100K, 16 GB VRAM)
~/ninfer-5070ti/scripts/run-5070ti-100k-mtp3.sh     # MTP3: aceptación 49–65 %, ~112–132 tok/s
~/ninfer-5070ti/scripts/run-5070ti-100k-dflash2.sh  # DFlash2: aceptación 25–46 %, ~112–170 tok/s
~/ninfer-5070ti/chat.py                             # cliente interactivo (con el server corriendo)

# d) LFM2.5-24B (Liquid) — ⛔ modelo eliminado 2026-11-01
~/start_lfm_server.sh
```

## 5. Reglas para cosas nuevas

- **Modelo GGUF nuevo** → `/mnt/models/gguf/` (+ anótalo en §2).
- **Herramienta/runtime** → `/mnt/models/tools/`.
- **Descargas HF/Unsloth** → `HF_HOME=/mnt/models/huggingface` (fijado en `~/.bashrc`); todo va a `hub/` y `xet/`, nunca al SSD. No cambiar `HF_HOME` sin actualizar §2.
- **Artefactos grandes de repos** → dentro del repo, gitignored, nunca en git. Los de `ninfer-5070ti` viven en el HDD y se acceden por symlink (§6); no moverlos sin actualizar este archivo.
- **Skills de agentes (OpenCode)** → `/mnt/models/tools/opencode-skills/` + symlink `~/.opencode/skills` (§8); nunca romper el symlink sin actualizar §3.
- **Paquetes globales npm** → `/mnt/models/tools/npm-global/` (o `tools/<tool>` si es una herramienta dedicada), con `prefix` en `~/.npmrc` y PATH en `~/.bashrc`; los CLIs también con symlink en `~/.local/bin/` (§3). Nada de esto va al SSD.
- **Dependencias opcionales de skills** (Playwright, pnpm, Blender…) → subcarpeta propia en `/mnt/models/tools/<tool>/` + symlink en `~/.local/bin/` (§8.1); nada de esto va al SSD ni al sistema.
- **Se rompió algo al mover** → busca referencias: `grep -rn "ruta-antiga" ~/ /mnt/models/ --include="*.sh" --include="*.json" --include="*.md"` (algunas configs usan rutas absolutas).

## 6. Repositorio `ninfer-5070ti` (SSD, `~/ninfer-5070ti`)

> Última revisión: **2026-10-19** (auditoría).

- **Qué es:** motor de inferencia LLM C++/CUDA para una sola GPU, fork de `roofkid/ninfer-4080`, portado a **`sm_120a`** (RTX 5070 Ti 16 GB, 70 SMs). Genealogía: `Neroued/ninfer` (5090) → `ninfer-4080` (`sm_89`) → este fork.
- **Modelo:** Qwen3.8-27B en perfil **gsq3** (3-bit GSQ), 100K contexto, visión, decodificación especulativa (MTP3 / DFlash2).
- **Git:** ramas `main` (actual) + `rtx4080-port`; `origin` = `aficado/Ninfer-5070_ti-fork`, `upstream` = `roofkid/ninfer-4080` (con `rtx4090-port`). `main` va 4 commits por delante de `upstream/rtx4080-port`:
  `6dac59ac` (build/ejecución en 5070 Ti) · `d5fc2e4c` (README 5070 Ti) · `ad5fc5d2` (README con resultados + `docs/results/rtx5070ti/`) · `e44ca73f` (launchers 100K; en `origin` desde 2026-10-13).
  Primer commit: 2026-06-25. `VERSION`: `0.6.1-rtx3090` (heredado, sin actualizar).
- **Trackeados (1 543):** src 715 · tests 185 · bench 147 · third_party 123 · tools 102 · eval 60 · include 48 · examples 39 · docs 37 · model-cards 29 · scripts 28 · raíz 16 · apps 10 · .codex 2 · dist 1 · .github 1.
- **Raíz (16):** `.clang-format`, `.clangd`, `.dockerignore`, `.gitattributes`, `.gitignore`, `AGENTS.md`, `CMakeLists.txt`, `CONTRIBUTING.md`, `Dockerfile`, `Dockerfile.dev`, `LICENSE`, `README.md`, `RELEASE_NOTES_0.6.0.md`, `RELEASE_NOTES_0.6.1.md`, `VERSION`, `vcpkg.json`.
- **Tamaño:** ~96 MB en el SSD (fuente + locales; ~120 MB con `.git`). El `build/` (40 GB) y el artefacto (13,3 GB) viven en el HDD vía symlinks.

**Artefacto de modelo (gitignored).** `scripts/models/qwen3_8_27b_gsq3.ninfer` — 13,3 GB (12,4 GiB), descargado 2026-10-08 18:23 con `scripts/download-qwen38-gsq3.sh` (SHA-256 verificado). Ubicación física: `/mnt/models/ninfer-5070ti-models/models/`. En VRAM: 11,2 GiB con MTP3 / 12,0 GiB con DFlash2. No hay más repos `nf` en el sistema.

**Build (no trackeado, 40 GB).** Compilado 2026-10-09 15:00 con `scripts/build-5070ti.sh` (CMake+Ninja, `CMAKE_CUDA_ARCHITECTURES=120a`, gcc-14). Ubicación física: `/mnt/models/ninfer-5070ti-build/build/`. Binarios: `apps/ninfer` 287,6 MB (CLI/CausalScoring) · `apps/ninfer-serve` 289,9 MB (servidor HTTP, API estilo OpenAI) · `apps/ninfer-perplexity` 287,6 MB + `tests/` y `bench/`.

**Launchers 100K** (`scripts/run-5070ti-100k-{mtp3,dflash2}.sh`, trackeados desde `e44ca73f`): ejecutan `build/apps/ninfer-serve` con el gsq3; fallan con mensaje claro si falta binario (→ `build-5070ti.sh`) o modelo (→ `download-qwen38-gsq3.sh`). Perfil base: `--max-context 102400 --kv-capacity 102400 --kv-dtype rk4v4-e8 --max-concurrency 1 --max-pending-requests 16 --prefill-chunk 2688 --host-kv-mib 4096 --vision --preserve-thinking`, puerto 8080.
- **MTP3** (`--spec mtp --draft-tokens 3 --lm-head-draft`): 11,2 GiB de pesos, ~1,48 GiB libres; aceptación 49–65 %; decode ~112–132 tok/s; prefill 424–606 tok/s; TTFT ~200 ms.
- **DFlash2** (`--spec dflash2 --draft-tokens 7 --lm-head-draft`): 12,0 GiB de pesos, ~0,54 GiB libres; aceptación 25–46 %; decode 112–170 tok/s (pico 169,9).
- Overrides por env: `NINFER_SERVER`, `NINFER_MODEL_DIR` (o arg posicional), `NINFER_PORT` (8080), `NINFER_BIND`, `NINFER_API_KEY`, `NINFER_DEFAULT_MAX_TOKENS`, `NINFER_DEFAULT_THINKING_BUDGET`, `NINFER_CUDA_LIBS` (prepending a `LD_LIBRARY_PATH` si el CUDA del sistema es < 13).
- ⚠️ **Cambio local sin commit (2026-10-18):** en ambos scripts el default de `NINFER_BIND` pasó de `127.0.0.1` a `0.0.0.0`; `origin` y `main` siguen en `127.0.0.1`.
- Arranque: ~40–44 s (pesos a 310–430 MiB/s, pin de 4 GB de KV, CUDA graphs ~1,5 s). DFlash2 necesita algo menos de contexto que MTP3 en 16 GB; MTP3 es el perfil más holgado.

**Archivos locales no trackeados** (se pierden si se reclona desde `origin`): `chat.py` (cliente interactivo) · `real_test.py` (test de calidad: 4 prompts reales, 512 tokens) · `ret_1..3.json` + `retrieval_report.json` (informes de retrieval; copias trackeadas en `docs/results/rtx5070ti/`) · `kv_{118784,122880,126976,131072}.log` (checks de cabida del KV) · `real_{mtp3,dflash2}.log` · `serve{,_1,_2,_3}.log`, `build.log`, `dl.log` · `nf-5070ti-arbol.txt` (64 KB) · `nf-5070ti-lista-completa.txt` (61 KB, snapshot 10-09) · `.codex/` (`hooks.json` + `hooks/clang_format.py`) · `profiles/` (bench + perplexity; gitignored) · `scripts/video.mp4` (29 MB, 2026-10-18).

**Resultados medidos** (trackeados en `docs/results/rtx5070ti/`):
- **Perplexidad 4,5967** (KV `rk4v4-e8`, corpus `ninfer-ppl-1m-v1`, 261 167 tokens puntuados, NLL media 1,5253) — `perplexity-int8-quick.json`.
- **Retrieval 98K + visión: 5/5 PASS** (`single_needle` → `QZ-7391-KESTREL`, `five_needles`, `code_detail`, `decode_at_depth`, `vision_chart`) — `retrieval_report.json`, `ret_2.json`, `ret_3.json`.
- **Prompts reales (512 tokens):** MTP3 111,6–124,9 tok/s (acept. 49–59 %) · DFlash2 112,1–169,9 tok/s (acept. 25–46 %) — `real_mtp3.log`, `real_dflash2.log`.

## 7. Proyecto `clinica-bienestar/` (SSD, web de la clínica Raíz Viva)

> Actualizado 2026-10-23. **No es git repo.**
> **2026-10-28 (auditoría):** confirmado — 15 tablas reales en la BD ✓ (la 16.ª, `sqlite_sequence`, es del sistema), ~125 archivos de fuente ✓ (conteo .ts/.tsx = 124). Sin cambios.

- **Qué es:** sitio móvil-primero en español (MX) de una clínica de bienestar: catálogos (`/gratis`, `/aprende`, `/servicios`, `/cursos`), reserva REAL (`/agendar`, 4 pasos, anti-doble-reserva desde R4-A), `/links` + cortos `/c/<slug>` con QR, y panel `/admin` (3 roles, 8 módulos: +Agenda).
- **Stack:** Next.js 15 + TypeScript + Tailwind 4 + **BD local SQLite** (`node:sqlite`, `data/clinica-bienestar.db`, 15 tablas — 12 de contenido/panel + `appointments`/`availability_rules`/`notifications` de R4-A, seed desde `lib/data.ts`). Citas reales en BD desde R4-A; usuarios reales (R4-C) y Supabase (despliegue) pendientes.
- **Estado:** R0–R2 certificadas; **R3-A–E ejecutadas** (gate pendiente del visto bueno formal, sin bugs reportados — el dueño pasó a R4 el 2026-10-23); **R4 EN CURSO: R4-A EJECUTADO (agenda real sobre SQLite)** — citas persistentes + anti-doble-reserva (`check:agenda` PASS), `/admin/horarios`, `/mi-cita` por token, cola de correos stub (Resend → R4-D). Retirado 8.05; diferidos 8.03/8.09. Plan: `docs/BACKLOG-R4.md`.
- **Cifras:** 31 rutas · 125 archivos (app 34 · components 38 · lib 20 · scripts 3 · raíz 10 · public 11 · docs 9 + BD) · 15 448 líneas · 118 `TODO:` en 31 archivos de código.
- **Servicio:** `next start` en `:3000` (log `/tmp/opencode/serve.log`); visible en `http://100.69.186.68:3000/` (Tailscale) y `http://localhost:3000/`. Cambios de código requieren rebuild + restart.
- Detalle: arquitectura/archivo a archivo → `docs/ESTRUCTURA-DEL-CODIGO.md`; estado del release → `docs/BACKLOG-R3.md`; historia → `docs/ORGANIZACION-DEL-PROYECTO.md`. Si cambias el proyecto, actualiza aquí solo las cifras.

## 8. Skills de OpenCode (HDD + symlink)

> Físicas en el HDD; OpenCode las detecta por el symlink de §3.
> - Las **7 de diseño**: instaladas **2026-10-20** con el CLI oficial `npx -y ui-ux-pro-max-cli init --ai opencode` (repo `nextlevelbuilder/ui-ux-pro-max-skill`, MIT, v2.15.0).
> - **`3dviz-pro-max`**: instalada el mismo día por **copia manual** de `viettranx/3dviz-pro-max` (MIT, v0.1.0, 829 ★). No tiene instalador oficial: se copia la carpeta `skills/3dviz-pro-max/` tal cual (10,2 MB).

- **Qué son:** cada skill es `SKILL.md` + datos locales (CSV/JSON) + scripts Python de stdlib; sin dependencias de terceros ni red, y se activan solas cuando el trabajo encaja (UI/UX, 3D…). Las 7 de diseño son "inteligencia de diseño" (el motor de búsqueda es `ui-ux-pro-max/scripts/search.py`). `3dviz-pro-max` es escenas 3D / visualización y puzzles espaciales: **223 recipes + 440 registros de conocimiento** (24 direcciones, 22 blueprints de kits, 37 perfiles de estilo), scaffold Vite+Three.js (sin `node_modules`) y scripts `search.py`, `resolve.py`, `design-context.py`, `host-probe.py`, `capture.py`, `blender_locate.py`, `hero-tier.py`.
- **Físicas en:** `/mnt/models/tools/opencode-skills/` (17 MB, 8 skills; re-medido 2026-11-01). **Acceso:** `~/.opencode/skills/` (symlink → HDD, §3).
- **Las 8 skills:**

| Skill | Tamaño | Para qué |
|---|---|---|
| `ui-ux-pro-max` ⭐ | 3,8 MB | Design intelligence: 79 estilos (50 activos), 192 paletas + 192 reglas de razonamiento por industria, 74 pairings tipográficos, 119 guidelines UX, 105 íconos, 25 gráficas, 22 stacks; generador de design systems (v2.0+) |
| `design` | 356 KB | Suite completa: logos (55 estilos), identidad corporativa (CIP, 50 entregables), banners, slides, íconos |
| `design-system` | 264 KB | Tokens de 3 capas (primitivo→semántico→componente), specs de componentes, slides |
| `ui-styling` | 220 KB | shadcn/ui + Tailwind, dark mode, accesibilidad, layouts |
| `brand` | 148 KB | Voz de marca, identidad visual, style guides, consistencia |
| `slides` | 40 KB | Presentaciones HTML estratégicas (Chart.js, copywriting) |
| `banner-design` | 28 KB | Banners para social/ads/web (22 estilos) |
| `3dviz-pro-max` ⭐ | 12 MB | Escenas 3D / visualización y puzzles espaciales: catálogo 223 recipes + 440 conocimientos, scaffold Vite+Three.js, capturas (`capture.py`), bakes T3 en Blender (`blender_locate.py`, `hero-tier.py`); sin Blender los kits tocan techo en T2, T4 no se distribuye |

- **Requisito runtime base:** Python 3 del sistema (3.14.4) — todos los scripts son solo stdlib; lo opcional (Playwright/pnpm/Blender) está en §8.1.
- **Verificado (2026-10-20):** los 8 `SKILL.md` son legibles a través del symlink; `ui-ux-pro-max` genera el design system correctamente; en `3dviz-pro-max`, `search.py "gears"` (BM25 sobre el catálogo), `host-probe.py` (detecta la RTX 5070 Ti) y `blender_locate.py` (encuentra el Blender de §8.1 por PATH) funcionan desde el HDD.

### 8.1 Dependencias opcionales de `3dviz-pro-max` (instaladas 2026-10-20, en el HDD)

Cada una en su propia carpeta bajo `/mnt/models/tools/`, con symlink en `~/.local/bin/` (§3). Sin ellas la skill funciona (kits T1–T2 = solo Vite+Three.js):

| Herramienta | Carpeta (HDD) | Tamaño | Habilita |
|---|---|---|---|
| Playwright + Chromium headless | `/mnt/models/tools/playwright/` | 837 MB | `capture.py`: capturas PNG + log de consola de la escena servida (exit 3 si falta Playwright, 4 si la escena no fija `window.__sceneReady === true`; usar `--ready-flag none` si no aplica) |
| pnpm 12.14.0 | `/mnt/models/tools/pnpm/` | 60 MB | Scaffold: `pnpm install && pnpm dev` (o `pnpm build` → `dist/`, que es lo que lee `capture.py`); deps se instalan en el proyecto, no en la skill |
| Blender 5.2.2 LTS | `/mnt/models/tools/blender/` | 1,2 GB | Bakes T3 (`.glb`) y `hero-tier.py`; sin Blender, `{"status": "unavailable"}` y kits a T2 |

**Cómo usarlas:**

```bash
# pnpm y Blender: ya están en el PATH (symlinks de ~/.local/bin/)
pnpm --version              # 12.14.0
blender --version           # Blender 5.2.2 LTS

# Playwright: usar el wrapper `pw3d` (fija el venv + PLAYWRIGHT_BROWSERS_PATH)
pw3d ~/.opencode/skills/3dviz-pro-max/scripts/capture.py /ruta/proyecto/dist --view 0
# (equivalente sin wrapper: PLAYWRIGHT_BROWSERS_PATH=/mnt/models/tools/playwright/browsers
#  /mnt/models/tools/playwright/venv/bin/python <script> …)
```

- **Playwright:** venv en `playwright/venv/` (pip) + `playwright/browsers/` (Chromium headless shell 156.0.8078.4). `PLAYWRIGHT_BROWSERS_PATH` es **obligatoria en runtime** (los navegadores no están en la ruta por defecto). Verificado: captura headless OK sin root (las librerías del sistema ya estaban presentes).
- **Blender:** binario real en `blender/blender-5.2.2-linux-x64/blender`; la skill lo detecta por `shutil.which('blender')`, así que el symlink basta (sin root). URL directa: `https://download.blender.org/release/Blender5.2/blender-5.2.2-linux-x64.tar.xz` (366 MB; el patrón 5.x es `release/BlenderX.Y/blender-X.Y.Z-…`, no el de 4.x).
- **Actualizar:** 7 de diseño → `npx -y ui-ux-pro-max-cli update` (re-escibe los archivos desde el paquete npm y caen directo al HDD). `3dviz-pro-max` → **sin CLI**: anotar la nueva revisión y reemplazar la carpeta completa (`rm -rf /mnt/models/tools/opencode-skills/3dviz-pro-max && cp -r skills/3dviz-pro-max /mnt/models/tools/opencode-skills/` desde un clon actualizado); nunca mezclar archivos de dos revisiones. Dependencias → reconstruir la carpeta correspondiente (venv / `npm install -g --prefix DIR` / re-extracción del tar).
- **Quitar:** borrar la carpeta en el HDD (+ el symlink de `~/.local/bin/` si aplica); para borrar todas las skills, `rm -rf /mnt/models/tools/opencode-skills && rm ~/.opencode/skills` (quitar el symlink). Nunca dejar un symlink colgando sin avisar en §3.

## 9. Para cualquier IA que lea este archivo

Este archivo **debe mantenerse actualizado**: cualquier cambio (mover, renombrar, añadir, borrar, versionar) en los archivos, carpetas, modelos, symlinks o scripts descritos aquí se registra en su sección — §2 (árbol), §3 (home/symlinks/scripts), §4 (recetario) y §6–7 (repos), y §8 (skills) — y en §1 si afecta al consumo de disco.
