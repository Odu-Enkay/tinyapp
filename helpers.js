//====== HELPER FUNCTION =========
const getUserByEmail = function(email, database) {
  for (const userID in database) {
    if (database[userID].email === email) {
      const user = database[userID];
      return user;
    }
  }
  return null;
};

//===== urlsForUser() FUNCTION ========
const urlsForUser = function (id, urlDatabase) {
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
  return Math.random().toString(36).substring(0,6);
}

module.exports = {getUserByEmail, urlsForUser, generateRandomString};