# tl_multimarcas
 
# Resetear repositorio local

git fetch
git reset --hard HEAD
git merge origin main

# Configurar certificado https

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