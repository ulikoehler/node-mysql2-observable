const mysql = require('mysql2/promise');
const fs = require('mz/fs');

/**
 * This class is intended to be inherited by YOUR
 * database class. Your database can implement custom functions
 * running queries on the database.
 * This baseclass handles setting up the MySQL connection.
 *
 * Access the database connection by "this.conn".
 * Note that it is a mysql2/promise connection
 * facilitating async/await queries.
 *
 * Best used with runWithDB()
 * 
 * Example usage:
 * class MyDatabase extends AbstractMySQLDatabase {
 *      async QueryMyThing(param) {
 *          let [rows, fields] = await this.conn.query(`
 *              SELECT ... WHERE key = ?`, [param])
 *          return rows.map(row => row.id)
 *      }
 * }
 * 
 * runWithDB(MyDatabase, "config.json", async (db) => {
 *     let result = db.QueryMyThing(12345);
 *     console.log(result)
 * })
 */
class AbstractMySQLDatabase {
    /**
     * Construct a new database instance.
     * Does not connect automatically. Remember to "await db.Connect()"!
     */
    constructor(settingsOrConfig) {
        this.settings = settingsOrConfig;
        this.conn = null;
    }

    /**
     * Safely close the database connection.
     * If using runWithDB(), calling this manually is NOT neccessary.
     */
    Close() {
        if(this.conn !== null) {
            this.conn.close();
            this.conn = null;
        }
    }

    /**
     * Connect this database to the MySQL server.
     */
    async Connect() {
        if(typeof this.settings === "string") { // => filename
            this.settings = await fs.readFile(this.settings);
        }
        return await mysql.createConnection(this.settings);
    }
}

/**
 * Run a given async function with a new instance of a
 * database (extending AbstractMySQLDatabase),
 * automatically setting up and 
 * Usage example:
 * 
 * runWithDB(MyDatabase, "config.json", async (db) => {
 *     let result = db.QueryMyThing(12345);
 *     console.log(result)
 * })
 */
async function runWithDB(constr, configSrc, fn) {
    let db = constr(configSrc)
    try {
        await db.Connect()
        await fn(db)
    } finally {
        db.Close();
    }
}

module.exports = {
    AbstractMySQLDatabase: AbstractMySQLDatabase,
    runWithDB: runWithDB
}
