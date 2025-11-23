const bcrypt = require("bcrypt");
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "thriftin_utm"
});

async function createAdmin() {
  const email = "admin@gmail.com";
  const password = "Admin123"; 
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("Creating admin with:");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Hash:", hashedPassword);
    
    const userSql = `INSERT INTO user (email, password, user_type) VALUES (?, ?, 'admin')`;
    
    db.query(userSql, [email, hashedPassword], (err, result) => {
      if (err) {
        console.error("Error:", err);
        db.end();
        return;
      }
      
      const userId = result.insertId;
      console.log("User created with ID:", userId);
      
      const adminSql = "INSERT INTO admins (user_id) VALUES (?)";
      db.query(adminSql, [userId], (err) => {
        if (err) {
          console.error("Error:", err);
        } else {
          console.log("Admin created successfully!");
          console.log("\n Login credentials:");
          console.log("Email:", email);
          console.log("Password:", password);
        }
        db.end();
      });
    });
  } catch (error) {
    console.error("Error:", error);
    db.end();
  }
}

createAdmin();