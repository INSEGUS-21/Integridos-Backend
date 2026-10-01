Run npm test

> integridos-backend@1.0.0 test
> npm run test-local


> integridos-backend@1.0.0 test-local
> start-server-and-test start http://localhost:3000 test-api-local

1: starting server using command "npm run start"
and when url "[ 'http://localhost:3000' ]" is responding with HTTP status code 200
running tests using command "npm run test-api-local"


> integridos-backend@1.0.0 start
> node src/index.js

Backend Now Running on port 3000
Conectado a MongoDB

> integridos-backend@1.0.0 test-api-local
> npx newman run src/test/UsersApiTest.json -e src/test/localhost.postman_environment.json && npx newman run src/test/TransactionsApiTest.json -e src/test/localhost.postman_environment.json

newman

Users API

→ 1. DELETE ADMIN- Limpiar BD Inicial
  DELETE http://localhost:3000/api/v1/Admin/Users [204 No Content, 207B, 21ms]
  ✓  Base de datos limpiada correctamente (Status 204)

→ 2. GET - Lista Usuarios Vacía
  GET http://localhost:3000/api/v1/Users [200 OK, 267B, 6ms]
  ✓  Status es 200
  ✓  La lista está vacía

→ 3. GET - Cargar Datos Iniciales (Éxito)
  GET http://localhost:3000/api/v1/Users/loadInitialData [201 Created, 271B, 28ms]
  ✓  Datos iniciales cargados (Status 201)

→ 4. GET - Cargar Datos Iniciales ERROR (Ya existen datos)
  GET http://localhost:3000/api/v1/Users/loadInitialData [409 Conflict, 273B, 3ms]
  ✓  Conflicto al recargar datos (Status 409)

→ 5. GET - Obtener Todos los Usuarios y Guardar ID
  GET http://localhost:3000/api/v1/Users [200 OK, 4.1kB, 5ms]
  ✓  Status es 200
  ✓  Hay usuarios en la base de datos

→ 6. POST - Login Correcto (carlos99)
  ┌
  │ `Using "CryptoJS" is deprecated. Use "require('crypto-
  │ js')" instead.`
  └
  POST http://localhost:3000/api/v1/login [403 Forbidden, 410B, 9ms]
  1. Login correcto (Status 200)

→ 7. POST - Login ERROR (Contraseña Incorrecta - Fallo 1)
  ┌
  │ `Using "CryptoJS" is deprecated. Use "require('crypto-
  │ js')" instead.`
  └
  POST http://localhost:3000/api/v1/login [403 Forbidden, 410B, 3ms]
  2. Credenciales incorrectas (Status 401)

→ 8. POST - Login ERROR (Parámetros Incompletos - Fallo 2)
  ┌
  │ `Using "CryptoJS" is deprecated. Use "require('crypto-
  │ js')" instead.`
  └
  POST http://localhost:3000/api/v1/login [400 Bad Request, 390B, 2ms]
  ✓  Parámetros incompletos (Status 400)

→ 9. POST - Login ERROR (Fallo Integridad HMAC - Fallo 3)
  ┌
  │ `Using "CryptoJS" is deprecated. Use "require('crypto-
  │ js')" instead.`
  └
  POST http://localhost:3000/api/v1/login [403 Forbidden, 410B, 2ms]
  ✓  Fallo HMAC bloqueado (Status 403)

→ 10. POST - Login ERROR (Ataque Replay / Nonce Usado - Fallo 4)
  POST http://localhost:3000/api/v1/login [403 Forbidden, 410B, 2ms]
  3. Ataque Replay bloqueado (Status 400)

→ 11. POST - Login ERROR (Consumir Límite de Intentos - Fallo 5)
  ┌
  │ `Using "CryptoJS" is deprecated. Use "require('crypto-
  │ js')" instead.`
  └
  POST http://localhost:3000/api/v1/login [429 Too Many Requests, 443B, 3ms]
  4. Credenciales incorrectas quinto intento (Status 401)

→ 12. POST - Login ERROR (Superado Límite de Intentos - Status 429)
  ┌
  │ `Using "CryptoJS" is deprecated. Use "require('crypto-
  │ js')" instead.`
  └
  POST http://localhost:3000/api/v1/login [429 Too Many Requests, 443B, 2ms]
  ✓  Bloqueado por Rate Limit tras 5 fallos (Status 429)
  ✓  Mensaje de aviso de Rate Limit correcto

→ 13. POST - Register Correcto
  ┌
  │ `Using "CryptoJS" is deprecated. Use "require('crypto-
  │ js')" instead.`
  └
  POST http://localhost:3000/api/v1/register [403 Forbidden, 306B, 4ms]
  5. Usuario registrado con éxito (Status 201)

→ 14. POST - Register ERROR (Usuario Ya Existe)
  ┌
  │ `Using "CryptoJS" is deprecated. Use "require('crypto-
  │ js')" instead.`
  └
  POST http://localhost:3000/api/v1/register [403 Forbidden, 306B, 2ms]
  6. Usuario ya existe bloqueado (Status 409)

→ 15. GET - Obtener Usuario Por ID (Éxito con Token)
  GET http://localhost:3000/api/v1/Users/6abe71f5a1f6ccd420e80276 [401 Unauthorized, 280B, 1ms]
  7. Status es 200
  8. El ID del usuario coincide

→ 16. GET - Obtener Usuario Por ID ERROR (Sin Token / No Autorizado)
  GET http://localhost:3000/api/v1/Users/6abe71f5a1f6ccd420e80276 [401 Unauthorized, 280B, 2ms]
  ✓  Sin autenticación bloqueado (Status 401)

→ 17. GET - Obtener Usuario Por ID ERROR (No Existe)
  GET http://localhost:3000/api/v1/Users/651c8b8f9a2b3c4d5e6f7a8b [401 Unauthorized, 280B, 1ms]
  9. Usuario no encontrado (Status 404)

→ 18. POST - Método Prohibido en /Users/:id
  POST http://localhost:3000/api/v1/Users/6abe71f5a1f6ccd420e80276 [401 Unauthorized, 280B, 2ms]
 10. Método no permitido (Status 405)

→ 19. DELETE - Eliminar Usuario Por ID ERROR (Sin Token)
  DELETE http://localhost:3000/api/v1/Users/6abe71f5a1f6ccd420e80276 [401 Unauthorized, 280B, 1ms]
  ✓  Sin autenticación bloqueado (Status 401)

→ 20. DELETE - Eliminar Usuario Por ID ERROR (No Existe)
  DELETE http://localhost:3000/api/v1/Users/651c8b8f9a2b3c4d5e6f7a8b [401 Unauthorized, 280B, 1ms]
 11. Usuario no existe para borrar (Status 404)

→ 21. DELETE - Eliminar Usuario Por ID (Éxito)
  DELETE http://localhost:3000/api/v1/Users/6abe71f5a1f6ccd420e80276 [401 Unauthorized, 280B, 1ms]
 12. Usuario borrado exitosamente (Status 204)

→ 22. DELETE - Limpiar BD Final
  DELETE http://localhost:3000/api/v1/Users [401 Unauthorized, 280B, 1ms]
 13. Base de datos limpiada al finalizar (Status 204)

┌─────────────────────────┬─────────────────┬─────────────────┐
│                         │        executed │          failed │
├─────────────────────────┼─────────────────┼─────────────────┤
│              iterations │               1 │               0 │
├─────────────────────────┼─────────────────┼─────────────────┤
│                requests │              22 │               0 │
├─────────────────────────┼─────────────────┼─────────────────┤
│            test-scripts │              22 │               0 │
├─────────────────────────┼─────────────────┼─────────────────┤
│      prerequest-scripts │               8 │               0 │
├─────────────────────────┼─────────────────┼─────────────────┤
│              assertions │              26 │              13 │
├─────────────────────────┴─────────────────┴─────────────────┤
│ total run duration: 410ms                                   │
├─────────────────────────────────────────────────────────────┤
│ total data received: 4.27kB (approx)                        │
├─────────────────────────────────────────────────────────────┤
│ average response time: 4ms [min: 1ms, max: 28ms, s.d.: 6ms] │
└─────────────────────────────────────────────────────────────┘

   #  failure         detail                                                                  
                                                                                              
 01.  AssertionError  Login correcto (Status 200)                                             
                      expected response to have status code 200 but got 403                   
                      at assertion:0 in test-script                                           
                      inside "6. POST - Login Correcto (carlos99)"                            
                                                                                              
 02.  AssertionError  Credenciales incorrectas (Status 401)                                   
                      expected response to have status code 401 but got 403                   
                      at assertion:0 in test-script                                           
                      inside "7. POST - Login ERROR (Contraseña Incorrecta - Fallo 1)"        
                                                                                              
 03.  AssertionError  Ataque Replay bloqueado (Status 400)                                    
                      expected response to have status code 400 but got 403                   
                      at assertion:0 in test-script                                           
                      inside "10. POST - Login ERROR (Ataque Replay / Nonce Usado - Fallo 4)" 
                                                                                              
 04.  AssertionError  Credenciales incorrectas quinto intento (Status 401)                    
                      expected response to have status code 401 but got 429                   
                      at assertion:0 in test-script                                           
                      inside "11. POST - Login ERROR (Consumir Límite de Intentos - Fallo 5)" 
                                                                                              
 05.  AssertionError  Usuario registrado con éxito (Status 201)                               
                      expected response to have status code 201 but got 403                   
                      at assertion:0 in test-script                                           
                      inside "13. POST - Register Correcto"                                   
                                                                                              
 06.  AssertionError  Usuario ya existe bloqueado (Status 409)                                
                      expected response to have status code 409 but got 403                   
                      at assertion:0 in test-script                                           
                      inside "14. POST - Register ERROR (Usuario Ya Existe)"                  
                                                                                              
 07.  AssertionError  Status es 200                                                           
                      expected response to have status code 200 but got 401                   
                      at assertion:0 in test-script                                           
                      inside "15. GET - Obtener Usuario Por ID (Éxito con Token)"             
                                                                                              
 08.  JSONError       El ID del usuario coincide                                              
                      Unexpected token 'u' at 1:1                                             
                      unautorized                                                             
                      ^                                                                       
                      at assertion:1 in test-script                                           
                      inside "15. GET - Obtener Usuario Por ID (Éxito con Token)"             
                                                                                              
 09.  AssertionError  Usuario no encontrado (Status 404)                                      
                      expected response to have status code 404 but got 401                   
                      at assertion:0 in test-script                                           
                      inside "17. GET - Obtener Usuario Por ID ERROR (No Existe)"             
                                                                                              
 10.  AssertionError  Método no permitido (Status 405)                                        
                      expected response to have status code 405 but got 401                   
                      at assertion:0 in test-script                                           
                      inside "18. POST - Método Prohibido en /Users/:id"                      
                                                                                              
 11.  AssertionError  Usuario no existe para borrar (Status 404)                              
                      expected response to have status code 404 but got 401                   
                      at assertion:0 in test-script                                           
                      inside "20. DELETE - Eliminar Usuario Por ID ERROR (No Existe)"         
                                                                                              
 12.  AssertionError  Usuario borrado exitosamente (Status 204)                               
                      expected response to have status code 204 but got 401                   
                      at assertion:0 in test-script                                           
                      inside "21. DELETE - Eliminar Usuario Por ID (Éxito)"                   
                                                                                              
 13.  AssertionError  Base de datos limpiada al finalizar (Status 204)                        
                      expected response to have status code 204 but got 401                   
                      at assertion:0 in test-script                                           
                      inside "22. DELETE - Limpiar BD Final"                                  
Error: Command failed with exit code 1: npm run test-api-local
    at makeError (/home/runner/work/Integridos-Backend/Integridos-Backend/node_modules/execa/lib/error.js:60:11)
    at handlePromise (/home/runner/work/Integridos-Backend/Integridos-Backend/node_modules/execa/index.js:118:26)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5) {
  shortMessage: 'Command failed with exit code 1: npm run test-api-local',
  command: 'npm run test-api-local',
  escapedCommand: '"npm run test-api-local"',
  exitCode: 1,
  signal: undefined,
  signalDescription: undefined,
  stdout: undefined,
  stderr: undefined,
  failed: true,
  timedOut: false,
  isCanceled: false,
  killed: false
}
Error: Process completed with exit code 1.