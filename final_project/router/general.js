const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

const sendJson = (res, status, data) =>
  res.status(status).type('json').send(JSON.stringify(data, null, 4));

/* ------------------------- Public routes ------------------------- */

public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (users.some((u) => u.username === username)) {
    return res.status(409).json({ message: "User already exists!" });
  }
  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

public_users.get('/', (req, res) => {
  return sendJson(res, 200, books);
});

public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return sendJson(res, 404, { message: "Book not found" });
  return sendJson(res, 200, { isbn: req.params.isbn, ...book });
});

public_users.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  if (result.length === 0) return sendJson(res, 404, { message: "No books found for this author" });
  return sendJson(res, 200, { booksbyauthor: result });
});

public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .map((isbn) => ({ isbn, ...books[isbn] }));
  if (result.length === 0) return sendJson(res, 404, { message: "No books found with this title" });
  return sendJson(res, 200, { booksbytitle: result });
});

public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return sendJson(res, 404, { message: "Book not found" });
  return sendJson(res, 200, book.reviews);
});

/* ---------------- Axios client functions (Task 11) ---------------- */

// All books: async/await
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

// By ISBN: Promise callbacks
const getBookByISBN = (isbn) =>
  axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`).then((response) => response.data);

// By author: async/await
const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

// By title: Promise callbacks
const getBooksByTitle = (title) =>
  axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`).then((response) => response.data);

const handleError = (res, error) => {
  const status = error.response ? error.response.status : 500;
  const message = error.response ? error.response.data : { message: "Server error" };
  return res.status(status).json(message);
};

public_users.get('/async/books', async (req, res) => {
  try {
    return res.status(200).json(await getAllBooks());
  } catch (error) {
    return handleError(res, error);
  }
});

public_users.get('/async/isbn/:isbn', (req, res) => {
  getBookByISBN(req.params.isbn)
    .then((data) => res.status(200).json(data))
    .catch((error) => handleError(res, error));
});

public_users.get('/async/author/:author', async (req, res) => {
  try {
    return res.status(200).json(await getBooksByAuthor(req.params.author));
  } catch (error) {
    return handleError(res, error);
  }
});

public_users.get('/async/title/:title', (req, res) => {
  getBooksByTitle(req.params.title)
    .then((data) => res.status(200).json(data))
    .catch((error) => handleError(res, error));
});

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;