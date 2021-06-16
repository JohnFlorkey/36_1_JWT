/** User class for message.ly */
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');
const db = require('../db');
const ExpressError = require('../expressError');
/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (
        username,
        password,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at
      )
      VALUES ($1, $2, $3, $4, $5, now(), now())
      RETURNING 
        username,
        password,
        first_name,
        last_name,
        phone`,
      [username, hashedPassword, first_name, last_name, phone])

      return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    try {
      const result = await db.query(
        `SELECT password
        FROM users
        WHERE username = $1`,
        [username]
      );
  
      const hashedPassword = result.rows[0]["password"];
  
      return await bcrypt.compare(password, hashedPassword);
    } catch {
      return false
    }
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
      SET last_login_at = now()
      WHERE username = $1`,
      [username]
    );
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    const result = await db.query(
      `SELECT
        username,
        first_name,
        last_name,
        phone
      FROM users`
    );

    return result.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    const result = await db.query(
      `SELECT
        username,
        first_name,
        last_name,
        phone,
        join_at,
        last_login_at
      FROM users
      WHERE username = $1`,
      [username]
    );

    return result.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT
        m.id,
        u.username,
        u.first_name,
        u.last_name,
        u.phone,
        m.body,
        m.sent_at,
        m.read_at
      FROM messages AS m
      INNER JOIN users as u ON u.username = m.to_username
      WHERE from_username = $1`,
      [username]
    );

    const formattedResult = result.rows.map((row) => {
      return {
        id: row.id,
        to_user: {
          username: row.username,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone
          },
        body: row.body,
        sent_at: row.sent_at,
        read_at: row.read_at
      }
    });

    return formattedResult;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    const result = await db.query(
      `SELECT
        m.id,
        u.username,
        u.first_name,
        u.last_name,
        u.phone,
        m.body,
        m.sent_at,
        m.read_at
      FROM messages AS m
      INNER JOIN users as u ON u.username = m.from_username
      WHERE to_username = $1`,
      [username]
    );

    const formattedResult = result.rows.map((row) => {
      return {
        id: row.id,
        from_user: {
          username: row.username,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone
          },
        body: row.body,
        sent_at: row.sent_at,
        read_at: row.read_at
      }
    });

    return formattedResult;
  }
}

module.exports = User;