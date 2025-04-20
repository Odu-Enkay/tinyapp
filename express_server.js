const express = require("express");
const bcrypt = require("bcryptjs");
const getUserByEmail = require('./helpers');
cookieSession = require('cookie-session');
const app = express();
const PORT = 8080;
const crypto = require('crypto');


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // this lets you take data from a form

app.use(cookieSession({
  name: 'session',
  keys: ["someStrings"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))



//======GLOBAL OBJECT=====
const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$N67X7BZxddU/3kf.RywW..TErHFFgwuxU8EqbYCY2.T1t/aqOKHNq",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$N67X7BZxddU/3kf.RywW..TErHFFgwuxU8EqbYCY2.T1t/aqOKHNq",
  },
};

const urlDatabase = {
  b2xVn2: {
    longURL:"http://www.lighthouselabs.ca",
    userID: "aJ48lW"
  },
"9sm5xK": {
  longURL: "http://www.google.com",
  userID: "aJ49lW"
}
};

//===== urlsForUser() FUNCTION ========
const urlsForUser = function (id) {
  const userURLs = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userURLs[shortURL] = urlDatabase[shortURL];
    }
  }
  return userURLs;
}

// Function to generate a random string
function generateRandomString() {
  return crypto.randomBytes(6).toString('hex');
}


// ROUTE ============= HANDLERS
/*app.get("/urls", (req, res) => {
  const userID = req.cookies.user_id;
  const user = users[userID];

  if(!user) {
    //console.log(res.status(401).send('Please log in to view your URLs'));
    return res.redirect('/login');

  }
  const userURLs = urlsForUser(userID);
  const templateVars = { 
    urls: userURLs, 
    user: user 
  };  
  res.render("urls_index", templateVars);
}); */

app.get("/urls", (req, res) => {
  const userID = req.session.user_id;

  if (!userID) {
    return res.redirect('/login?message=You must be logged in to view your URLs.');
  }

  const userUrls = urlsForUser(userID);
  const templateVars = {
    urls: userUrls,
    user: users[userID]
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.redirect('/login');
  }
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session.user_id;
  const user = users[userID]
  const longURL = urlDatabase[req.params.id].longURL
  const templateVars = { id: req.params.id, longURL: longURL, user: user };
  res.render("urls_show", templateVars);
});

app.get('/u/:id', (req, res) => {
  const shortURLID = req.params.id;    // fetches the user input and store inthe shortURLID
  //const longURL = urlDatabase[shortURLID].longURL;
  const longURL = urlDatabase[shortURLID].longURL;

  if (longURL) {
    res.redirect(longURL);
  } else {
    res.status(404).send('URL not found.'); // Handle non-existent short URLs
  }
});

// Fetching the Sessions  =============== USER LOGIN
app.get('/register', (req, res) => {
  const userID = req.session.user_id
  const user = users[userID];
  if (user) {
    return res.redirect('/urls');
  }
  const templateVars = {user:user};
  return res.render("register", templateVars);
})
// POST ===================== METHODS Here:

app.get("/login", (req, res) => {
  const userID = req.session.user_id
  const user = users[userID];
  if (user) {
    return res.redirect('/urls');
  }
  const templateVars = {user: user};
  res.render("login", templateVars);
}) 

app.post('/urls', (req, res) => {
  const userID =req.session.user_id;
  const user = users[userID];
  if (!user) {
    return res.status(401).send("You must login to shorten urls!");
  }
  // const longURL = req.body.longURL;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {longURL: req.body.longURL, userID: userID };
  
  // Redirect to the page showing the new short URL
  res.redirect(`/urls/${shortURL}`);
});

/*app.post('/urls/:id/delete', (req, res) => {
  const id = req.params.id;  //extracts the shortURLID from the URL parameters
  const shortURL = req.params.id; 
  delete urlDatabase[shortURL]; // to delete key-value pair from the urlDatabase
  res.redirect('/urls'); 
}),*/

app.post("/urls/:id/delete", (req, res) => {
  const urlID = req.params.id;
  const userID = req.session.user_id;

  if (!userID || urlDatabase[urlID].userID !== userID) {
    return res.status(403).send("You don't have permission to delete this URL.");
  }

  // Proceed with deleting the URL
  delete urlDatabase[urlID];
  res.redirect("/urls");
});

app.post('/urls/:id', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  if (!user) {
    return res.status(401).send("You must be logged in to shortten url.");
  }
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  if (!urlDatabase[id].longURL) {
    return res.status(404).send("Cannot edit url, except you have an account");
  }
  urlDatabase[id].longURL = newLongURL;
  res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
  const urlID = req.params.id;
  const userID = req.session.user_id;

  if (!userID || urlDatabase[urlID].userID !== userID) {
    return res.status(403).send("You don't have permission to edit this URL.");
  }

  // Proceed with updating the URL
  urlDatabase[urlID].longURL = req.body.longURL;
  res.redirect("/urls");
});

// ======== REGISTER, LOGIN, LOGOUT =========
app.post('/register', (req, res) => {
  const {email, password} = req.body;
  
  // ==== Error condition 1 ========
  if (!email || !password) {
    return res.status(400).send("You need email and password to register.");
    
  }
  // =====  Error condition 2 =======
  if (getUserByEmail(email)) {
    return res.status(400).send("Email already exists!");
  }
  
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password,10);
  users[id] = { id, email, password: hashedPassword }; // Stores the password 
  req.session.user_id = id;
  console.log("New user registered:", users[id]);
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  console.log(user);
  // ====== Error Condition 1 ======
  if (!user){
    return res.status(403).send("App user not found!")
  }
  // ====== Error Condition 2 ======
  if (bcrypt.compareSync(password, user.password)) {
      
  // Credentials are correct; set user_id cookie
      req.session.user_id = user.id
      res.redirect('/urls');
      return;
  }
  return res.status(403).send("Wrong username or password!")
  
});


  //res.cookie('user_id', user.id);
  //res.redirect('/urls');

app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/urls');
});

// ===== SERVER CONNECTION ========
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});


