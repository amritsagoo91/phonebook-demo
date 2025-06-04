const express = require('express');
const morgan = require('morgan');
const app = express();

//Middlewares
app.use(express.json())
//app.use(morgan('tiny'))

app.use(express.static('dist'))

morgan.token('postData', (req, res) => {
    if (req.method === 'POST' && res.statusCode !== 409) {
        return JSON.stringify(req.body)
    }
    return JSON.stringify({ error: 'Name must be unique' })
})

app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postData', {
    skip: (req) => req.method !== 'POST'
}))

app.use(morgan('tiny', {
    skip: (req) => req.method === 'POST'
}))

let persons = [
    {
        "id": "1",
        "name": "Arto Hellas",
        "number": "040-123456"
    },
    {
        "id": "2",
        "name": "Ada Lovelace",
        "number": "39-44-5323523"
    },
    {
        "id": "3",
        "name": "Dan Abramov",
        "number": "12-43-234345"
    },
    {
        "id": "4",
        "name": "Mary Poppendieck",
        "number": "39-23-6423122"
    }
]



// const requestLogger = (request, response, next) => {    //customeLogger
//     console.log('Method::', request.method)
//     console.log('Path::', request.path)
//     console.log('Body::', request.body)
//     console.log('----')
//     next()
// }

// app.use(requestLogger)




const generateId = () => {
    const maxId = persons.length > 0
        ? Math.max(...persons.map(person => Number(person.id)))
        : 0
    return String(maxId + 1)
}

app.get('/info', (req, res) => {

    const numberOfPersons = persons.length
    const date = new Date()

    res.send(`<p>Phonebook has info for ${numberOfPersons} people</p>
        <p>${date}</p>`
    )
})


app.get('/api/persons', (req, res) => {
    if (!persons) {
        res.status(404).end()
    }
    res.json(persons)
})

app.get('/api/persons/:id', (req, res) => {
    const id = req.params.id;
    const person = persons.find(person => person.id === id)
    if (!person) {
        res.status(404).json({ error: 'Person not found' })
    }
    res.json(person)
})

app.delete('/api/persons/:id', (req, res) => {
    const id = req.params.id;
    persons = persons.filter(person => person.id !== id)

    res.status(204).end()
})

app.post('/api/persons', (req, res) => {
    const body = req.body;

    if (!body.name || !body.number) {
        res.status(404).json({ error: 'Missing information' })
    }

    if (persons.find(p => p.name.toLowerCase() === body.name.toLowerCase())) {
        return res.status(409).json({ error: 'Name must be unique' })
    }
    const newPerson = {
        id: generateId(),
        name: body.name,
        number: body.number
    }

    persons = persons.concat(newPerson)
    res.status(201).json(newPerson)

})


const unknownEndPoint = (req, res, next) => {
    res.status(404).json({ error: 'unknown endpoint' })

}

app.use(unknownEndPoint)


const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`)
})