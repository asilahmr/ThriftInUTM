const bcrypt = require('bcrypt');

bcrypt.hash('aina12345', 10).then(hash => {
  console.log(hash);
});
