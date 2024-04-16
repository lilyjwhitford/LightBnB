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
    SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
    FROM reservations
    JOIN properties on reservations.property_id = properties.id
    JOIN property_reviews ON properties.id = property_reviews.property_id
    WHERE reservations.guest_id = $1 AND reservations.end_date < now()::date
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    LIMIT $2`,
    [guest_id, limit])
    .then((result) => {
      if (result.rows.length === 0) {
        return [];
      }
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
  const queryParams = [];
  const prefix = queryParams.length > 0 ? 'AND' : 'WHERE';

  let queryString = `
    SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON properties.id = property_reviews.property_id
  `;

  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length}`;
  }

  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `${prefix} owner_id = $${queryParams.length}`;
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    const minPrice = options.minimum_price_per_night * 100;
    const maxPrice = options.maximum_price_per_night * 100;
    queryParams.push(minPrice, maxPrice);
    queryString += `${prefix} cost_per_night BETWEEN $${queryParams.length - 1} AND $${queryParams.length}`;
  }

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `${prefix} avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const { owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, 
    street, city, province, post_code, country, parking_spaces, 
    number_of_bathrooms, number_of_bedrooms } = property;
  return pool
    .query(`INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, 
      street, city, province, post_code, country, parking_spaces, number_of_bathrooms, number_of_bedrooms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *;
    `,
    [owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, 
      street, city, province, post_code, country, parking_spaces, 
      number_of_bathrooms, number_of_bedrooms])
    .then((result) => {
        return result.rows[0];
    })
    .catch((err) => {
      console.error(err.stack);
    });

};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
