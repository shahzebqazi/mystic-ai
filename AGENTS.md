Role: Senior AI/ML Researcher and Systems Architect.
Task: Build the "Seance" Framework—a bi-directional bridge between Human Genomic Data and Neural Network Architectures.

Ethics and limitations: see [ETHICS.md](ETHICS.md).
I. Mathematical Objectives

    Forward Seance (fforward​): Map a Genomic Feature Vector (G) to a set of Neural Hyperparameters (H).

        Input: .vcf (Variant Call Format) or polygenic score indices.

        Output: A config.json for a Transformer model (Context Length, Sparsity, Attention Head count, Learning Rate).

    Reverse Seance (freverse​): Map Model Weights (θ) or specific Activation Patterns to a probability distribution of "Digital Ancestors."

        Input: A trained model checkpoint and an Attribution Database.

        Output: A ranked list of human contributors based on Influence Functions or TRAK (Tracing Real-world AI Knowledge).

II. Functional Requirements
Module 1: The Genomic Parser (Bio -> Spec)

    Integrate a Genomic Foundation Model (e.g., Evo or HyenaDNA) as a feature extractor.

    Implement a mapping function that translates Polygenic Risk Scores (PRS) for cognitive traits (Working Memory, Processing Speed) into model primitives.

    Requirement: Use Python with pandas for data handling and biopython for sequence parsing.

Module 2: The Attribution Engine (Weights -> Bio)

    Implement an influence-estimation module using the TRAK library or Shapley Value approximations.

    Create a "Synthetic Ancestor Registry"—a mock database of human profiles (Metadata: Name, Known Works/Data, Genetic Profile).

    Requirement: The engine must identify which "Ancestor" has the highest influence on a specific model output or weight cluster.

Module 3: The CLI/Interface

    Develop a CLI.

    Provide a --seance-forward flag taking a DNA file and producing a model config.

    Provide a --seance-reverse flag taking a prompt/output and returning a "Lineage Tree."

III. Tech Stack Constraints

    Language: Python 3.11+

    Frameworks: PyTorch, HuggingFace Transformers, traker (for attribution).

    Optimization: Ensure compatibility with macos/cursor.

    Style: Clean, modular code; type hinting throughout; docstrings following NumPy/Google style.

IV. Initial Sprint Goal

Construct a minimal script that:

    Generates a synthetic 1D "DNA sequence."

    Uses a linear transfer function to set the n_heads and d_model of a GPT-style architecture based on "GC-content" or "SNP density."

    Simulates a "Reverse Seance" that attributes a "Hello World" output to one of three mock authors based on a pre-computed Influence Matrix.

"Begin 'Project Seance' implementation now. Focus on the mathematical mapping of fforward​ first. How should we weight SNP-density against context-window length?"