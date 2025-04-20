// ===== REQUIREMENTS =====
const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
} = require("./helpers");
const { users, urlDatabase } = require("./db");

// ==== SERVER SET-UP AND MIDDLEWARES ====
const app = express();
const PORT = 8080;
app.set("view engine", "ejs"); // ejs views template
app.use(express.urlencoded({ extended: true })); // Allows req.body
app.use(
  cookieSession({
    name: "session",
    keys: ["someStrings"],
    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
); // to add the req.session

// ROUTE =============  RESOURCE HANDLERS
// URLs RENDERING ROUTES (INDEX, NEW, SHOW)
// URLs INDEX
app.get("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect(
      "/login?message=You must be logged in to view your URLs."
    );
  }

  const urls = urlsForUser(userID, urlDatabase);
  const templateVars = {
    urls,
    user,
  };

  res.render("urls_index", templateVars);
});

// URLs NEW
app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect(
      "/login?message=You must be logged in to view your URLs."
    );
  }

  const templateVars = { user };
  res.render("urls_new", templateVars);
});

// URLs SHOW
app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect(
      "/login?message=You must be logged in to view your URLs."
    );
  }

  const longURL = urlDatabase[req.params.id].longURL;
  const templateVars = { id: req.params.id, longURL, user };
  res.render("urls_show", templateVars);
});

// SHORT URL REDIRECT LINK
app.get("/u/:id", (req, res) => {
  const shortURLID = req.params.id; // fetches the user input and store inthe shortURLID
  const longURL = urlDatabase[shortURLID].longURL;
  if (!longURL) {
    return res.status(404).send("URL not found."); // Handle non-existent short URLs
  }
    res.redirect(longURL); 
});

// ====AUTH RENDERING ROUTES (REGISTER, LOGIN)===============
app.get("/register", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = { user: null};
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (user) {
    return res.redirect("/urls");
  }
  const templateVars = { user: null};
  res.render("login", templateVars);
});

// DATA HANDLERS ===================== URL CRUD - REST API Here:
// CREATE - POST
app.post("/urls", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.status(401).send("You must login to shorten urls!");
  }

  const longURL = req.body.longURL;
  if (!longURL) {
    return res.status(400).send("LongUrl missing in body");
  }

  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID};

  // Redirect to the page showing the new short URL
  res.redirect(`/urls/${shortURL}`);
});

// READ ALL - GET
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// READ ONE - GET
app.get("/urls.json/:id", (req, res) => {
  res.json(urlDatabase[req.params.id]);
});

// UPDATE  - POST
app.post("/urls/:id", (req, res) => {
  const userID= req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.status(401).send("You must be logged in to shortten url.");
  }

  const newLongURL = req.body.longURL;
  if (!newLongURL) {
    return res.status(400).send("Long URL missing in the body!");
  }

  const urlObject = urlDatabase[req.params.id];
  if (!urlObject) {
    return res.status(400).send("URL Not Found!");
  }

  const urlBelongsToUser = urlObject.userID === userID
if (!urlBelongsToUser) {
    return res.status(403).send("You don't have right to edit this URL.");
  }

  urlDatabase[req.params.id].longURL = newLongURL;
  res.redirect("/urls");
});

// DELETE - POST
app.post("/urls/:id/delete", (req, res) => {
  const userID= req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.status(401).send("You must be logged in to shortten url.");
  }

  const urlObject = urlDatabase[req.params.id];
  if (!urlObject) {
    return res.status(400).send("URL Not Found!");
  }

  const urlBelongsToUser = urlObject.userID === userID
if (!urlBelongsToUser) {
    return res.status(403).send("You don't have right to edit this URL.");
  }

  // Proceed with deleting the URL
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// ====== AUTH REST API ======= DATA HANDLING ROUTES
// ======== REGISTER, LOGIN, LOGOUT =========
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("You need email and password to register.");
  }

  const emailExist = getUserByEmail(email, users);
  if (emailExist) {
    return res.status(400).send("Email already exists!");
  }

  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = { id, email, password: hashedPassword }; // Stores the password
  
  req.session.user_id = id;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send("You need email and password to login");
  }

  const user = getUserByEmail(email, users);
  if (!user) {
    return res.status(400).send("Invalid credentials!");
  }
  
  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch) {
    return res.status(400).send("Invalid credentials!");
  }

  req.session.user_id = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// ===== SERVER LISTENER - ACCEPTS INCOMING REQUESTS ========
app.listen(PORT, () => {
  console.log(`Tiny app listening on port ${PORT}!`);
});
