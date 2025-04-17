const express = require("express");
const app = express();
const PORT = 8080;
const crypto = require('crypto');
const cookieParser = require('cookie-parser');


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // this lets you take data from a form
app.use(cookieParser());

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Function to generate a random string
function generateRandomString() {
  return crypto.randomBytes(6).toString('hex');
}

// ROUTE ============= HANDLERS
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies.username };  
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies.username };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  const templateVars = { id: req.params.id, longURL: longURL, username: req.cookies.username };
  res.render("urls_show", templateVars);
});

app.get('/u/:id', (req, res) => {
  const shortURLID = req.params.id;    // fetches the user input and store inthe shortURLID
  const longURL = urlDatabase[shortURLID];

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send('URL not found.'); // Handle non-existent short URLs
  }
});

// Fetching the Cookies  =============== USER LOGIN
app.get("/login", (req, res) => {
  const templateVars = {username: req.cookies.username};
  res.render("login", templateVars);
})

app.get('/register', (req, res) => {
  const error = req.cookies.error;
  const templateVars = { error };
  return res.render("register", templateVars);
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// POST ===================== METHODS Here:
app.post('/urls', (req, res) => {
  const longURL = req.body.longURL;
  const shortURLID = generateRandomString();
  
  urlDatabase[shortURLID] = longURL;
  
  // Redirect to the page showing the new short URL
  res.redirect(`/urls/${shortURLID}`);
});

app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;  //extracts the shortURLID from the URL parameters
  delete urlDatabase[id]; // to delete key-value pair from the urlDatabase
  res.redirect('/urls'); 
}),

app.post('/urls/:id', (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  //console.log(req.body);
  if (urlDatabase[id]) {
    //console.log(newLongURL);
    urlDatabase[id] = newLongURL; 
  } 
    const longURL = urlDatabase[req.params.id];
    const templateVars = { id: req.params.id, longURL: longURL, username: req.cookies.username };
    res.render("urls_show", templateVars);

  res.redirect('/urls'); 
})

app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username); 
  res.redirect('/urls');
})

app.post('/logout', (req, res) => {
  res.clearCookie("username");
  res.redirect('/urls');
})