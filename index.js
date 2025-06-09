const express = require('express')
const morgan = require('morgan')
const People = require('./models/person.js')
const app = express()

// Middleware
app.use(express.json())
app.use(express.static('dist'))

// Custom Morgan token for logging POST request bodies
morgan.token('postData', (req, res) => {
  if (req.method === 'POST' && res.statusCode !== 409) {
    return JSON.stringify(req.body)
  }
  return JSON.stringify({ error: 'Name must be unique' })
})

// Logging only POST requests with custom body
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :postData', {
  skip: req => req.method !== 'POST'
}))

// Logging other (non-POST) requests
app.use(morgan('tiny', {
  skip: req => req.method === 'POST'
}))

// GET /info - Summary of phonebook
app.get('/info', (req, res, next) => {
  People.find({})
    .then(people => {
      const date = new Date()
      res.send(`
                <p>Phonebook has info for ${people.length} people</p>
                <p>${date}</p>
            `)
    })
    .catch(error => next(error))
})

// GET /api/persons - Get all contacts
app.get('/api/persons', (req, res, next) => {
  People.find({})
    .then(people => res.json(people))
    .catch(error => next(error))
})

// GET /api/persons/:id - Get a contact by ID
app.get('/api/persons/:id', (req, res, next) => {
  People.findById(req.params.id)
    .then(person => {
      if (person) {
        res.json(person)
      } else {
        res.status(404).end()
      }
    })
    .catch(error => next(error))
})

// DELETE /api/persons/:id - Delete contact by ID
app.delete('/api/persons/:id', (req, res, next) => {
  People.findByIdAndDelete(req.params.id)
    .then(() => res.status(204).end())
    .catch(error => next(error))
})

// POST /api/persons - Create new contact
app.post('/api/persons', (req, res, next) => {
  const { name, number } = req.body

  if (!name || !number) {
    return res.status(400).json({ error: 'Missing name or number' })
  }

  const newPerson = new People({ name, number })

  newPerson.save()
    .then(savedPerson => res.status(201).json(savedPerson))
    .catch(error => next(error))
})

// PUT /api/persons/:id - Update existing contact
app.put('/api/persons/:id', (req, res, next) => {
  const { name, number } = req.body

  People.findByIdAndUpdate(
    req.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )
    .then(updatedPerson => {
      if (!updatedPerson) {
        return res.status(404).end()
      }
      res.json(updatedPerson)
    })
    .catch(error => next(error))
})

// Middleware: unknown endpoint
const unknownEndpoint = (req, res) => {
  res.status(404).json({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

// Middleware: centralized error handler
const errorHandler = (error, req, res, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message })
  }

  next(error)
}
app.use(errorHandler)

// Start server
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
