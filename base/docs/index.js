const express = require('express')
const swaggerUi = require('swagger-ui-express')
const YAML = require('yamljs')
const path = require('path')

const app = express()
const OPENAPI_PATH = process.env.OPENAPI_PATH || '/openapi-users-spec.yaml'
const spec = YAML.load(OPENAPI_PATH)

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec))
app.get('/', (req, res) => res.redirect('/docs'))

const PORT = process.env.PORT || 8080
app.listen(PORT, () => console.log(`Docs UI running on http://0.0.0.0:${PORT}/docs`))
