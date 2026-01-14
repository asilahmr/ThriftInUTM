const bcrypt = require('bcrypt');

bcrypt.hash('test12345', 10).then(hash => {
  console.log(hash);
});
