# Dockerfile for ACE-Step 1.5 Music Generation API
# Supports CUDA GPU acceleration
# Uses uv for fast Python package installation

FROM nvidia/cuda:12.8.0-runtime-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    ACESTEP_API_HOST=0.0.0.0 \
    ACESTEP_API_PORT=8001 \
    ACESTEP_INIT_LLM=auto \
    DOWNLOAD_SOURCE=auto

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    git \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3.11 /usr/bin/python

# Install uv (fast Python package installer)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy ACE-Step-1.5 submodule
COPY ACE-Step-1.5 /app/ACE-Step-1.5
WORKDIR /app/ACE-Step-1.5

RUN uv sync

# Activate the virtual environment
ENV PATH="/app/ACE-Step-1.5/.venv/bin:$PATH"

# Expose API port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Run the API server using the CLI script defined in pyproject.toml
CMD ["acestep-api"]
