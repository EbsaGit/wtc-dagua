# tl_multimarcas
 
# Resetear repositorio local

git fetch
git reset --hard HEAD
git merge origin main

# Configurar certificado https

# Opción 1 - Chocolately
abrir Powershell con permisos de administrador

Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

choco install mkcert

ir a la ruta del proyecto y posicionarse dentro de la carpeta cert/

mkcert -install

mkcert ${ip local de la maquina}

//Modificar el archivo app.js (Cargar los archivos del certificado y la clave privada generados por mkcert)
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', '${ip local de la maquina}-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', '${ip local de la maquina}.pem'))
};

OBS: Reemplazar ${ip local de la maquina} por la ip local de la maquina. Ej. 192.168.100.26

# Opcion 2 - Instalacion manual de mkcert

1. Descargar mkcert https://github.com/FiloSottile/mkcert/releases
OBS: Busca la última versión y descarga el archivo mkcert-vX.X.X-windows-amd64.exe

2. Renombra el archivo descargado de "mkcert-vX.X.X-windows-amd64.exe" a "mkcert.exe" para facilitar su uso.

3. Mueve mkcert.exe a una carpeta en tu sistema que sea fácilmente accesible desde la línea de comandos.

C:\mkcert\

4. Agregar mkcert al PATH

C:\mkcert\

5. Instalar el certificado raíz con mkcert

mkcert -install

6. Generar un certificado SSL para la IP local de tu máquina. Reemplazar ${ip local de la maquina} por la ip local de la maquina. Ej. 192.168.100.26
mkcert ${ip local de la maquina}

7. Copiar lo archivos generados (.pem) a la carpeta "cert" del proyecto y modificar el archivo "app.js"

const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'cert', '${ip local de la maquina}-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert', '${ip local de la maquina}.pem'))
};