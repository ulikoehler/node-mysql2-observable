const QueryPaginator = require("./QueryPaginator").QueryPaginator
const CreateMySQLConnectionFromConfigFile =
    require("./ConnectionUtils").CreateMySQLConnectionFromConfigFile

module.exports = {
    QueryPaginator: QueryPaginator,
    CreateMySQLConnectionFromConfigFile: CreateMySQLConnectionFromConfigFile
}