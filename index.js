const express = require('express')
const app = express()

app.use(express.static(__dirname, {maxAge: 2592000000}))

app.listen(3001, () => console.log('Listinging on port 3001!'))
