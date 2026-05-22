# mlx-gemma

A **development kit** for building on **Gemma 4** with **[MLX](https://github.com/ml-explore/mlx)** on Apple Silicon. It standardizes dependencies, project layout, and extension points so you can prototype prompts, tools, and workflows instead of re-solving environment and model wiring each time.

Gemma 4 is Google’s open multimodal family (text, vision, audio in; text out), with dense and MoE sizes and long context. On Mac, inference and fine-tuning are typically done through **MLX** and **mlx-lm**, which includes Gemma 4 model code (see [mlx-lm](https://github.com/ml-explore/mlx-lm)).

## What this kit is for

- **Apps and CLIs** that load Gemma 4 MLX weights (local or Hugging Face) and run generation or chat-style loops.
- **Scripts and notebooks** that share one virtualenv and one import path (`mlx_gemma`).
- **Future hooks** in this repo: example prompts, small eval or bench helpers, and templates—without turning the repo into a full framework.

## What it is not

- Not a fork of `mlx` or `mlx-lm`; those stay upstream. This repo pins and documents how we use them for Gemma 4.
- Not tied to a single model card; you choose quantized or full weights compatible with mlx-lm’s Gemma 4 implementation.

## Requirements

- macOS with Apple Silicon (recommended for MLX).
- Python 3.10+ (adjust in `pyproject.toml` if you standardize on a newer floor).

## Setup

```bash
cd mlx-gemma
python -m venv .venv
source .venv/bin/activate
pip install -U pip
pip install -e ".[dev]"
```

Download or point to Gemma 4 MLX-compatible weights (for example from Hugging Face) and run them with `mlx-lm`’s APIs or CLIs; use this package for shared code and examples as they land in `src/mlx_gemma` and `examples/`.

## Layout

| Path | Role |
|------|------|
| `src/mlx_gemma/` | Reusable Python modules for the dev kit (config, helpers, shared types). |
| `examples/` | Runnable examples and starters. |
| `models/` | Local weight checkouts (gitignored; use symlinks or env vars). |

## License

Specify your license here.
