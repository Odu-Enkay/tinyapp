const express = require("express");
const app = express();
const PORT = 8080;
const crypto = require('crypto');
const cookieParser = require('cookie-parser');


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // this lets you take data from a form
app.use(cookieParser());

//======GLOBAL OBJECT=====
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//====== HELPER FUNCTION =========
const getUserByEmail = (email) => {
  for (const userID in users) {
    if (users[userID].email === email) {
      return users[userID];
    }
  }
  return null;
};

// Function to generate a random string
function generateRandomString() {
  return crypto.randomBytes(6).toString('hex');
}


// ROUTE ============= HANDLERS
app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];
  const templateVars = { urls: urlDatabase, user: user };  
  res.render("urls_index", templateVars);
});


app.get("/urls/new", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID]
  const longURL = urlDatabase[req.params.id];
  const templateVars = { id: req.params.id, longURL: longURL, user: user };
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
  const userID = req.cookies.user_id;
  const user = users[userID];
  const templateVars = {user: user};
  res.render("login", templateVars);
})

app.get('/register', (req, res) => {
  const userID = req.cookies.user_id
  const user = users[userID];
  const templateVars = {user:user};
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
  const userID = req.cookies.user_id;
  const user = users[userID];
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  //console.log(req.body);
  if (urlDatabase[id]) {
    //console.log(newLongURL);
    urlDatabase[id] = newLongURL; 
  } 
    const longURL = urlDatabase[req.params.id];
    const templateVars = { id: req.params.id, longURL: longURL, user: user };
    res.render("urls_show", templateVars);

    res.redirect('/urls'); 
})

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  const user = getUserByEmail(email);
  // ====== Error Condition 1 ======
  if (!user){
    return res.status(403).send("App user not found!")
  }
  // ====== Error Condition 2 ======
  if (password != user.password) {
    return res.status(403).send("Wrong username or password!")
  }
  res.cookie('user_id', user.id); 
  res.redirect('/urls');
})

app.post('/logout', (req, res) => {
  res.clearCookie("user_id");
  res.redirect('/urls');
})

app.post('/register', (req, res) => {
  const {email, password} = req.body;
    // ==== Error condition 1 ========
    if (!email || email.trim() === '' || !password || password.trim() === '') {
      return res.status(400).send("You need email and password to register.");
    }
  
    // =====  Error condition 2 =======
    if (getUserByEmail(email)) {
      return res.status(400).send("Email already exists!");
    }
  
  const id = generateRandomString();
  users[id] = { id, email, password }; // Stores the password 
  console.log("New user registered:", users[id]);
  res.cookie('user_ID', id);
  res.redirect('/urls');
});
