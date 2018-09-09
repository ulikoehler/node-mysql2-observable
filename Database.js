const mysql = require('mysql2/promise');
const fs = require('mz/fs');
const ObservableQueryPaginator = require('./QueryPaginator').ObservableQueryPaginator;

/**
 * This class is intended to be inherited by YOUR
 * database class. Your database can implement custom functions
 * running queries on the database.
 * This baseclass handles setting up the MySQL connection pool.
 *
 * Access the database connection pool by "this.pool".
 * Use this.pool.getConnection() to get access to a connection.
 * Don't forget to this.pool.releaseConnection() the connection after using it!
 *
 * Alternatively, you can use the .Query() and .Execute() convenience
 * functions.
 *
 * Note that this class uses a mysql2/promise connection
 * facilitating async/await queries.
 *
 * Best used with runWithDB()
 *
 * Example usage:
 * class MyDatabase extends AbstractMySQLDatabase {
 *      async QueryMyThing(param) {
 *          let [rows, fields] = await this.pool.query(`
 *              SELECT ... WHERE key = ?`, [param])
 *          return rows.pipe(map(row => row.id))
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
    constructor (settingsOrConfig) {
        this.settings = settingsOrConfig;
        this.pool = null;
    }

    /**
     * Connect this database to the MySQL server.
     */
    async Connect () {
        if (typeof this.settings === 'string') { // => filename
            let content = await fs.readFile(this.settings);
            this.settings = JSON.parse(content);
        }
        this.pool = await mysql.createPool(this.settings);
    }

    /**
     * Safely close the database connection.
     * If using runWithDB(), calling this manually is NOT neccessary.
     */
    Close () {
        if (this.pool !== null) {
            this.pool.end();
            this.pool = null;
        }
    }

    /**
     * Identical to calling this.pool.query(sql, params)
     */
    async Query (sql, params) {
        return this.pool.query(sql, params);
    }

    /**
     * Identical to calling this.pool.query(sql, params)
     */
    async Execute (sql, params) {
        return this.pool.execute(sql, params);
    }

    /**
     * Utility to create a ObservableQueryPaginator with the given parameters
     * and calling Query() on it. Directly returns the observable.
     * See ObservableQueryPaginator for more docs.
     */
    QueryObservable (sql, params = [], pagesize = 10000) {
        let qp = new ObservableQueryPaginator(this.pool, sql, params, pagesize);
        return qp.Query();
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
async function runWithDB (constr, configSrc, fn) {
    let db = new constr(configSrc);
    try {
        await db.Connect();
        await fn(db);
    } finally {
        db.Close();
    }
}

module.exports = {
    AbstractMySQLDatabase: AbstractMySQLDatabase,
    runWithDB: runWithDB
};
