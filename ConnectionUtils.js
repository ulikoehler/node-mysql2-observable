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
async function CreateMySQLConnectionFromConfigFile(filename) {
    let config = await fs.readFile("config.json");
    return await mysql.createConnection(this.settings);
}

module.exports = {
    CreateMySQLConnectionFromConfigFile: CreateMySQLConnectionFromConfigFile
}
