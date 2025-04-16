const express = require("express");
const app = express();
const PORT = 8080;
const crypto = require('crypto');


app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// Function to generate a random string
function generateRandomString() {
  return crypto.randomBytes(6).toString('hex');
}

app.use(express.urlencoded({ extended: true })); // this lets you take data from a form

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase }; // check with 
  res.render("urls_index", templateVars);
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

// More routes and server setup...

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  const templateVars = { id: req.params.id, longURL: longURL };
  res.render("urls_show", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = { username: req.cookies.username };
  res.render("login", templateVars);
})
/*app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
}); */

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Post Methods Here
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

  res.redirect('/urls'); 
})

app.post('/login', (req, res) => {
  const username = req.body.username;
  //console.log(username); testing if the username is captured
  res.cookie('username', username); 
  res.redirect('/urls');
})