'use strict';

const fs = require('fs');
const express = require('express');
const pg = require('pg');
const cors = require('cors');
const app = express();
const client = new pg.Client(process.env.DATABASE_URL || 'postgres://localhost:5432/books_app');
const PORT = process.env.PORT || 3000;

client.connect();
client.on('error', err => console.error(err));

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(cors());

app.get('/api/v1/books', (req, res) => {
  client.query("SELECT * FROM books")
    .then(results => res.send(results.rows))
    .catch(err => {
      console.error(err);
      res.sendStatus(500).send("Error");
    });
});

app.get('/api/v1/books/:id', (req, res) => {
  client.query(`SELECT * FROM books WHERE id = $1`, [req.params.id])
    .then(results => res.send(results.rows[0]))
    .catch(err => {
      console.error(err);
      res.sendStatus(500).send("Error");
    });
});

app.post('/api/v1/books', (req, res) => {
  console.log(req.body.book);
  let insert = `INSERT INTO books (title, author, isbn, image_url, description) VALUES($1, $2, $3, $4, $5);`
  let values = [req.body.title,
    req.body.author,
    req.body.isbn,
    req.body.image_url,
    req.body.description];

  client.query(insert, values)
    .then(results => res.json(results))
    .catch(err => {
      console.error(err);
      res.sendStatus(500).send("Error");
    });
});

app.get('*', (req, res) => res.send("Access Denied"));

loadDB();

app.listen(PORT, () => console.log(`Server up on port ${PORT}`));

//////////////////

function loadBooks() {


  console.log('loadBooks function called');
  client.query('SELECT COUNT(*) FROM books')
    .then(result => {

      if (!parseInt(result.rows[0].count)) {
        fs.readFile('../book-list-client/data/books.json', 'utf8', (err, fd) => {
          JSON.parse(fd).forEach(ele => {
            client.query(`
              INSERT INTO
              books(title, author, isbn, image_url, description)
              VALUES ($1, $2, $3, $4, $5);
            `, [ele.title, ele.author, ele.isbn, ele.image_url, ele.description])
          })
        })
      }
    })
}

function loadDB() {

  console.log('loadDB function called');
  client.query(`
    CREATE TABLE IF NOT EXISTS books (
      book_id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NOT NULL,
      isbn VARCHAR (255) NOT NULL,
      image_url VARCHAR(255) NOT NULL,
      description TEXT);`)
    .then(() => {
      loadBooks();
    })
    .catch(err => {
      console.error(err);
    });
}