FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    clang \
    llvm \
    libbpf-dev \
    linux-headers-generic \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

# Placeholder - actual build would compile eBPF programs
RUN echo "DDoS Engine placeholder container"

CMD ["sleep", "infinity"]
