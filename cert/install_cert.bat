﻿@echo off
REM Ruta de descarga del certificado (local donde se guardará el archivo descargado)
SET CERT_PATH="%TEMP%\rootCA.pem"

REM URL del archivo en la nube
SET CERT_URL="https://files-accl.zohoexternal.com/public/workdrive-external/download/2h9xpf53947b7464d4835a84642c81bd0c5eb"

REM Verificar si curl está disponible, si no, usar bitsadmin para descargar
echo Descargando el archivo del certificado...
curl --version >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    curl -o %CERT_PATH% %CERT_URL%
) ELSE (
    bitsadmin /transfer "DescargarCertificado" %CERT_URL% %CERT_PATH%
)

REM Verificar si el archivo se descargó correctamente
IF NOT EXIST %CERT_PATH% (
    echo Error al descargar el certificado. Verifica la URL o la conexión a internet.
    exit /b 1
)

REM Instalar el certificado en el almacén de "Autoridades de certificación raíz de confianza"
echo Instalando el certificado raíz en el almacén de autoridades de certificación de confianza...
certutil -addstore "Root" %CERT_PATH%

REM Verificar si la instalación fue exitosa
IF %ERRORLEVEL% EQU 0 (
    echo Certificado instalado correctamente.
) ELSE (
    echo Hubo un error al instalar el certificado.
    exit /b 1
)

REM Eliminar el archivo descargado (opcional)
del %CERT_PATH%

pause