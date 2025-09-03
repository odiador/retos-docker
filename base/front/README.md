Instrucciones
Se presentarán 5 retos
Cada tendrá uno o más pasos
Cada reto tiene valor de 1 punto
Al terminar un reto deberá presentarlo al profesor quien le asignará un punto por cada reto cumplido.
Tomando como punto de partida la aplicación creada para generar tokens (rama del reto 01), se desea crear un API Rest que permita realizar un CRUD de usuarios.
Reto 1
Usando Open Api, diseñe un conjunto de operaciones REST que le permitan gestionar los usuarios (debe incluir registro de usuario y demás métodos del CRUD, además de una operación para el login y recuperación de clave). El diseño debe describir cada una de las operaciones y para cada operación se debe establecer:

ruta (path)
Método HTTP a usar (GET,POST,PUT,DELETE,PATCH...)
Parámetros y/o datos requeridos. Debe incluir el formato, si es obligatorio o no, su tipo, si es obligatorio o no, y todos aquellos elementos que faciliten su comprensión.
Posibles respuestas (código HTTP de respuesta, descripción de su contenido), cada operación debe tener al menos 3 posibles códigos de respuesta.
Tenga en cuenta los elementos de seguridad donde sean necesarios.
Reto 2
Diseñe la información a almacenar para su API de Autenticación.
Seleccione el motor de base de datos que desea usar y desplieguelo usando docker-compose. alt text
Verifique el correcto despliegue y configuración de su sistema de almacenamiento de datos.
Cree una aplicación en el lenguaje de programación de su preferencia capaz de interactuar con la base de datos creada.
Despliegue la aplicación en un contenedor diferente a su base de datos y adicionelo al docker compose (No olvide establecer la conexión a la base de datos enviando los parámetros de conexión mediante variables de entorno).
Reto 3
Desarrolle los métodos que diseño para su API, tenga en cuenta:

El método de login de usuario, debe generar como respuesta un token o respuestas con los errores correspondiente.
Proteja los métodos sensibles como por el ejemplo los de actualización, para que dichos métodos sean realizados por un usuario autenticado y lo haga solo sobre sus propios datos.
No olvide tener un método que permita recuperar la clave de un usuario que la ha perdido.
Reto 4
Desarrolle un método que permita listar todos los usuarios del sistema, dicho método deberá hacer uso de paginación.

Reto 5
Usando su especificación OpenApi genere la interfaz para verificar el correcto funcionamiento de su API. Dicha interfaz debe desplegarse conjuntamente con su proyecto y deberá poderse acceder via web.