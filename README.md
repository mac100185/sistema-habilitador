Bienvenido al Sistema Habilitador

¿Qué es?

Es un cuaderno de notas que ha sido modificado para usarlo en el seguimiento del estado de los habilitadores o controles de seguridad que definamos para los equipos de trabajo (SQUAD) aplicados a sus proyectos (INICIATIVAS).

Requisitos

Este aplicativo esta basado en contenedores y aplicado en el entorno Docker, por lo cual la instalación debe se desplegado en este entorno.
Disponer de un espacio en disco mínimo de 4 GB como mínimo.
Es recomendable disponer de 8 GB de RAM
Se recomienda usar una instalación limpia de Linux Ubuntu Server (ubuntu-22.04.3-live-server-amd64)
Nota: no instalar Docker de forma separada, éste se desplegará durante la instalación.

¿Cómo se instala?

1) Para instalarlo se debe descargar de este proyecto en su formato comprimido usando diferentes métodos:

  Método Git: 

            git clone http://CualquierDominio:3000/agarcia/sistema-habilitador.git

  Método de servidor local: Para este caso, se deberá desplegar un servidor web donde subir el archivo comprimido del Sistema Habilitador. en la siguiente línea se pone como ejemplo un servidor web que almacena el sistema habilitador dentro del comprimido main.zip, luego es obtenido usando el comando wget, luego pasar al siguiente paso (2) de lo contrario ir al paso (3)

            wget http://CualquierDominio:3000/agarcia/sistema-habilitador/archive/main.zip

2) Descomprimir el archivo usando:
    Nota solo en caso que no disponga de la herramienta zip use el siguiente comando para instalarla:

            apt install zip -y

    Comando para descomprimir:

            unzip main.zip

3) Ingresar a la carpeta sistema-habilitador/Scripts dónde se encontrarán los archivos de configuración e instalación. Notar que antes debe otorgarle permisos de ejecución con chmod a todos los archivso .sh: 

            cd sistema-habilitador 
            cd Scripts
               
            chmod 777 sist_hab_prod_instalar.sh
            chmod 777 sist_hab_prod_instalar_sin_docker.sh
            chmod 777 sist_hab_prod_instalar_herramientas.sh
            chmod 777 sist_hab_prod_desinstalar.sh
            chmod 777 restart-container.sh
            chmod 777 stop-container.sh
            chmod 777 copiar_evidencias.sh
            chmod 777 reestablecer_evidencias.sh


4) Para instalar en un servidor sin Docker pre instalado ejecute el siguiente comando y siga las instrucciones:

            ./sist_hab_prod_instalar_herramientas.sh
            ./sist_hab_prod_instalar.sh

        Para instalar en un servidor con Docker pre instalado ejecute el siguiente comando y siga las instrucciones:

            ./sist_hab_prod_instalar_herramientas.sh
            ./sist_hab_prod_instalar_sin_docker.sh

¿Cómo se administra?
 Para detener los contenedores y apagar el servidor use el siguiente comando:

            ./stop-container.sh

 Para reiniciar el contenedor principal use el siguiente comando:

            ./restart-container.sh
 
¿Cómo se desinstala?

 Para desinstalar el aplicativo use el siguiente comando:

            ./sist_hab_prod_desinstalar.sh

¿Cómo acceder a los servicios?

Para iniciar debe identificar la dirección IP del servidor de contenedores (Docker-Server) donde realizó esta instalación y editar el archivo hosts del ordenador desde cual desee conectarse (No del Docker-Server), de la siguiente manera: si la IP del Docker-Server es 10.10.0.112 entonces la línea a agregar en el archivo HOST del cliente es:


             10.10.0.112 hack_tool

Luego abrir los siguientes enlaces para acceder a los servicios web
        
        Gestión del sistema habilitador

http://hack_tool:7777/

        Gestión de la base de datos (Nota: la base de datos es: "sisthabpro" el usuario es: root y la clave es: quanium)

http://hack_tool:82/

        Gestión del servidor Docker

http://10.10.0.112:4200/

¿Cómo se hace una copia de respaldo de los datos del sitema habilitador?

1) Realizar una copia de la base de datos (Creando el archivo "sisthabpro.sql")

        - Ingresar al gestor de base de datos "PhpMyAdmin"  y seleccionar la base de datos "sisthabpro"

        - Seleccionar en el menú la opción "Exportar"

        - Hacer clic en el botón "Exportar"

        - Guardar el archivo "sisthabpro.sql" exportado.


2) Realizar una copia de la carpeta de imágenes que contienen las evidencias (Creando el archivo "backup.zip")

        - Ingresar al servidor docker donde se encuentra desplegado el contenedor, ubicar la carpeta del sistema usada durante la instalación

        - Ingresar a la carpeta Scripts

        - Ejecutar el siguiente comando y seguir las instrucciones:

            ./copiar_evidencias.sh
        
        - Ingresar a la ruta indicada en los resultados del comando anterior:

        - Guardar el archivo descargado "backup.zip"

¿Cómo se reestablece una copia de respaldo de los datos del sitema habilitador?

1) Desplegar un servidor web y copiar en dicho despliegue el archivo comprimido de las evidencias.
        Se recomienda desplegar en una maquina con Windows el aplicativo XAMPP.

        - Ingresar a la carpeta de instalación de XAMPP y ubicar la carpeta "htdocs" (Normalmente se encuentra en la ruta "C:\xampp\htdocs\")

        - Copiar el archivo "backup.zip" en la carpeta "htdocs"

        - Iniciar el servidor web de Xampp

        - Ejecutar el siguiente comando y seguir las instrucciones:


            ./reestablecer_evidencias.sh
        
2) Desplegando la copia de base de datos

        - Ingresar al gestor de bases de datos "PhpMyAdmin" y eliminar la base de datos "sisthabpro"

        - Crear una nueva base de datos llamada "sisthabpro" con un charset "utf8mb4_unicode_ci"

        - Seleccionar la recien creada base de datos llamada "sisthabpro"

        - Seleccionar la opción "Importar"

        - En el botón "Elegir archivo" seleccionar el archivo "sisthabpro.sql" que se desea reestablecer.

        - Hacer clic en el botón "Importar"