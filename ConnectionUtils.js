const mysql = require('mysql2/promise');
const fs = require('mz/fs');

/**
 * Create a MySQL connection from a configuration
 * read from a JSON config file containing at least the following settings:
 *  - host
 *  - user
 *  - password
 *  - database
 */
async function CreateMySQLConnectionFromConfigFile (filename) {
    const config = await fs.readFile('config.json');
    return mysql.createConnection(config);
}

module.exports = {
    CreateMySQLConnectionFromConfigFile: CreateMySQLConnectionFromConfigFile
};
