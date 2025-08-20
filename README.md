# Retos de Docker

- [x] Instale docker en su equipo y verifique su correcto funcionamiento: [Reto 1](/Reto_1)

![a](/Images/Reto_1.png)
## Reto 2

- [ ] Cree un programa servidor tipo web que espere la llegada de una solicitud por el puerto 80, dicho
servidor debe responder de la siguiente forma:
  - [ ] Si la ruta es http://localhost/saludo?nombre=xxxx donde xxxx es el nombre de un usuario, el programa deberá responder con un código de estado 200 y un mensaje de respuesta "Hola nombreUsuario".
  - [ ] En cualquier la ruta es http://localhost/saludo, pero no se envía el parámetro nombre debe responder con un código de error 400 y un mensaje de respuesta "Solicitud no valida: El nombre es obligatorio"
  - [ ] Si la ruta es distinta a la indicada se debe responder con un código de error 404 y un mensaje de respuesta "Recurso no encontrado"
- [ ] Despliegue la aplicación creada en un contenedor usando docker compose.
- [ ] Verifique el correcto funcionamiento de su aplicación usando postman o una aplicación similar.

## Reto 3

- [ ] Investigue JWT
- [ ] Identifique y seleccione una herramienta para el manejo de la autenticación web.
- [ ] Despliegue dicha herramienta junto con la aplicación del reto anterior usando docker compose.
- [ ] Verifique el correcto funcionamiento invocando el servicio de autenticación de la herramienta desplegada y generando un token.

## Reto 4

- [ ] Modifique su aplicación para que cuando se invoque la ruta http://localhost/saludo?nombre=xxxx se verifique que la solicitud contenga una cabecera Authorization conun JWT valido (El token debe ser generado por la aplicación qye usted desplegó en el punto anterior). En caso de no tenerlo o ser invalido deberá responder con un código de error adecuado. El nombre en el parámetro path debe coincidir con el identificado
en el token.
- [ ] Verifique el correcto funcionamiento de su aplicación usando postman o una aplicación similar.


## Reto 5

- [ ] Con el fin de verificar el funcionamiento del sistema cree una tercera aplicación que obtenga un token de su sistema de autenticación y posteriormente invoque el servicio de saludo de su primera aplicación.
- [ ] Las URL para la autenticación y para el servicio de saludo deben ser configuradas mediante una variable de entorno.
- [ ] Al recibir la respuesta del servidor, el cliente deberá imprimirla en el log del sistema.
- [ ] Esta nueva aplicación debe desplegarse en el docker compose que ha venido usando.
