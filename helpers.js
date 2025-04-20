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

module.exports = {getUserByEmail};