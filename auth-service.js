const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");

// Define the schema for the User model
const userSchema = new Schema({
  userName: {
    type: String,
    unique: true, 
  },
  password: {
    type: String,
  },
  email: {
    type: String,
  },
  loginHistory: [
    {
      dateTime: {type: Date},
      userAgent: {type: String, },
    },
  ],
});

let User; // Variable to hold the User model

// Initialize the database connection and define the User model
function initialize() {
  return new Promise((resolve, reject) => {
    const db = mongoose.createConnection("mongodb+srv://sk3212255:2BEYiz1iyNqLge2D@cluster0.f57et.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"); 

    db.on("error", (err) => {
      reject(err); // Reject the promise if there is a connection error
    });

    db.once("open", () => {
      User = db.model("users", userSchema); // Define the User model based on the schema
      resolve(); // Resolve the promise once the model is defined
    });
  });
}

// Register a new user
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match"); // Reject if passwords do not match
    } else {
      // Encrypt the password
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          // Create a new user object
          const newUserData = {
            loginHistory:
              userData.userAgent && userData.userAgent !== "Unknown"
                ? [
                    {
                      dateTime: new Date(),
                      userAgent: userData.userAgent,
                    },
                  ]
                : [],
            userName: userData.userName,
            password: hash,
            email: userData.email,
          };

          // Create a new User instance and save it to the database
          const newUser = new User(newUserData);
          newUser
            .save()
            .then(() => resolve()) // Resolve the promise on successful save
            .catch((err) => {
              if (err.code === 11000) {
                reject("User Name already taken"); // Handle duplicate userName error
              } else {
                reject(`There was an error creating the user: ${err}`);
              }
            });
        })
        .catch(() => {
          reject("There was an error encrypting the password");
        });
    }
  });
}

// Check user credentials and update login history
function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName })
      .then((user) => {
        if (!user) {
          reject(`Unable to find user: ${userData.userName}`);
        } else {
          // Compare the provided password with the stored hash
          bcrypt
            .compare(userData.password, user.password)
            .then((result) => {
              if (!result) {
                reject(`Incorrect Password for user: ${userData.userName}`);
              } else {
                // Manage login history
                if (user.loginHistory.length === 8) {
                  user.loginHistory.pop(); // Remove oldest login entry if history is full
                }

                if (userData.userAgent && userData.userAgent !== "Unknown") {
                  user.loginHistory.unshift({
                    dateTime: new Date(),
                    userAgent: userData.userAgent,
                  });
                }

                // Update the user's login history
                User.updateOne(
                  { userName: user.userName },
                  { $set: { loginHistory: user.loginHistory } }
                )
                  .then(() => resolve(user)) // Resolve the promise with the user object
                  .catch((err) =>
                    reject(
                      `There was an error updating the user history: ${err}`
                    )
                  );
              }
            })
            .catch((err) => {
              reject(`There was an error verifying the password: ${err}`);
            });
        }
      })
      .catch((err) => {
        reject(`Unable to find user: ${userData.userName} - ${err}`);
      });
  });
}

module.exports = {
  initialize,
  registerUser,
  checkUser,
};
