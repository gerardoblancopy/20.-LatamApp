# Usa una imagen base oficial de Python
FROM python:3.10-slim

# Instala dependencias del sistema operativo (Node.js y GLPK para Pyomo en caso de usarlo)
RUN apt-get update && apt-get install -y \
    curl \
    lsb-release \
    gnupg \
    glpk-utils \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Configurar un usuario sin privilegios para Hugging Face Spaces (UID 1000)
RUN useradd -m -u 1000 user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Establecer directorio de trabajo
WORKDIR /app

# Asignar propiedad completa al usuario
RUN chown -R user:user /app

# A partir de aquí todo se ejecuta o pertenece al usuario `user`
USER user

# 1. Copiar y empaquetar entorno Node.js
COPY --chown=user:user package*.json ./
RUN npm install

# 2. Copiar y empaquetar entorno Python
COPY --chown=user:user requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# 3. Copiar el resto del repositorio
COPY --chown=user:user . .

# Variables de Entorno esperadas por Hugging Face Spaces
ENV PORT=7860
ENV PYTHON_CMD=python3

# Exponer el puerto
EXPOSE 7860

# Comando principal
CMD ["node", "server.js"]
