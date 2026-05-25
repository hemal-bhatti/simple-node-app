const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const fakeUsers = [
  {id : 1, name: 'hemal bhatti', email: 'hemal@bhatti.com', age: 20},
  {id : 2, name: 'Uday varmora', email: 'uday@example.com', age: 28 },
  {id : 3, name: 'Vishal Chavda', email: 'vishal@example.com', age: 28 },
  {id : 4, name: 'Jay bosmiya', email: 'jay@example.com', age: 25 },
  {id : 5, name: 'Amit jagda', email: 'amit@example.com', age: 30 }
];

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the simple backend API!' });
});

// GET /api/users - Fetch all users
app.get('/api/users', (req, res) => {
  res.json(fakeUsers);
});

// GET /api/users/:id - Fetch single user
app.get('/api/users/:id', (req, res) => {
  const user = fakeUsers.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// POST /api/users - Add new user (fake, doesn't persist)
app.post('/api/users', (req, res) => {
  const newUser = { id: fakeUsers.length + 1, ...req.body };
  fakeUsers.push(newUser);
  res.status(201).json(newUser);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});