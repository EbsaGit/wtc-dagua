# Pasos para instalar el certificado raíz en Windows manualmente:
1. Obtener la ruta del certificado con el siguiente comando: mkcert -CAROOT

2. Abrir el Administrador de certificados de Windows:

Presiona las teclas Windows + R para abrir la ventana "Ejecutar".
Escribe certmgr.msc y presiona Enter. Esto abrirá el Administrador de Certificados de Windows.
Seleccionar la ubicación para instalar el certificado:

3. En la ventana del Administrador de Certificados, verás una lista de diferentes tipos de certificados. En este caso, queremos instalar el certificado raíz en la categoría Autoridades de certificación raíz de confianza.
Haz clic derecho en Autoridades de certificación raíz de confianza (o Trusted Root Certification Authorities en inglés) y selecciona Todas las tareas > Importar.
Iniciar el Asistente para Importar Certificados:

4. Esto abrirá el "Asistente para Importar Certificados".
Haz clic en Siguiente para comenzar.
Seleccionar el archivo rootCA.pem:

5. En la siguiente pantalla, selecciona el archivo del certificado que deseas importar.
Haz clic en Examinar y navega hasta la ubicación de tu archivo rootCA.pem.
Nota: Asegúrate de cambiar el tipo de archivo de "Archivos de certificado (*.cer; *.crt)" a Todos los archivos (*.*) para que puedas seleccionar el archivo rootCA.pem.
Seleccionar el almacén de certificados:

6. Después de seleccionar el archivo, haz clic en Siguiente.
Selecciona Colocar todos los certificados en el siguiente almacén y asegúrate de que el almacén seleccionado sea Autoridades de certificación raíz de confianza.
Haz clic en Siguiente para continuar.
Completar la instalación:

7. Haz clic en Finalizar para completar el proceso de importación.
Verás un mensaje indicando que la importación fue exitosa.

# Opcion 2: Ejecutar el archivo install_ceret.bat como administrador