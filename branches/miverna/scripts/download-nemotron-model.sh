#!/usr/bin/env bash
# Download Llama-3.1 Nemotron Nano 8B (Q4_K_M GGUF) for local llama-server.
# Requires: https://huggingface.co/docs/huggingface_hub/guides/cli (`pip install huggingface_hub` → `hf`)

set -euo pipefail

REPO="${MINERVA_NEMOTRON_REPO:-itlwas/Llama-3.1-Nemotron-Nano-8B-v1-Q4_K_M-GGUF}"
DEST="${MINERVA_MODEL_DIR:-${HOME}/.minerva/models}"

mkdir -p "${DEST}"

if command -v hf >/dev/null 2>&1; then
  hf download "${REPO}" --local-dir "${DEST}"
elif command -v huggingface-cli >/dev/null 2>&1; then
  huggingface-cli download "${REPO}" --local-dir "${DEST}"
else
  echo "Install the Hugging Face CLI first, e.g.: pip install huggingface_hub" >&2
  echo "Then run: hf download ${REPO} --local-dir ${DEST}" >&2
  exit 1
fi

echo "Nemotron Nano GGUF downloaded into ${DEST}"
echo "Point Minerva Settings → GGUF path at the .gguf file in that folder (or rely on auto-pick of first *.gguf / Nemotron-named file)."
