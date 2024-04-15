const { Pool } = require("pg");

const pool = new Pool({
  user: "development",
  password: "development",
  host: "localhost",
  database: "lightbnb"
});

// pool.query(`SELECT title FROM properties LIMIT 10;`).then(response => {response}).catch(error => {console.log('error:', error.stack)});

const properties = require("./json/properties.json");
const users = require("./json/users.json");

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(`SELECT *
    FROM users
    WHERE email = $1`,
    [email])
    .then((result) => {
      if (result.rows.length) {
      return result.rows[0]; // return first user that matches email
      } else {
        return null; // return null if no user is found
      }
    })
    .catch((err) => {
      console.log(err.stack);
    }); 
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
    .query(`SELECT *
    FROM users
    WHERE id = $1`,
    [id])
    .then((result) => {
      if (result.rows.length) {
      return result.rows[0]; // return first user that matches id
      } else {
        return null; // return null if no id is found
      }
    })
    .catch((err) => {
      console.log(err.stack);
    }); 
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  const { name, email, password } = user; // user object containing name, email, password property
  return pool
    .query(`INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *;`,
    [name, email, password])
    .then((result) => {
      if (result.rows.length) {
        return result.rows[0];
      }
    })
    .catch((err) => {
      console.error(err.stack);
    });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(`
    SELECT reservations.*
    FROM reservations
    JOIN users ON reservations.guest_id = users.id
    WHERE reservations.guest_id = $1
    LIMIT $2`,
    [guest_id, limit])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  return pool
    .query(`SELECT *
    FROM properties
    LIMIT $1`,
    [limit])
    .then((result) => {
      console.log(result.rows);
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
