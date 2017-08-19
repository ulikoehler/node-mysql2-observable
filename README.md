# node-mysql2-observable
Convenient access to promise-based node-mysql2 using rxjs Observables and various ES6 features.

### Installation

```bash
npm i --save mysql2-observable
```

### AbstractMySQLDatabase example
Provides convenient & safe database object lifecycle management.

First, create a `config.json` file in the directory where your
script is located (`__dirname__`)

```json
{
    "host"     : "127.0.0.1",
    "user"     : "myuser",
    "database" : "mydb",
    "password" : "mypassword"
}
```

Then, you can create a custom subclass of `AbstractMySQLDatabase`
to automatically setup the [`mysql2`](https://github.com/sidorares/node-mysql2) connection pool.

```js
let myobs = require("mysql2-observable");

class MyDatabase extends myobs.AbstractMySQLDatabase {
     async QueryMyThing(param) {
         let [rows, fields] = await this.Query(`
             SELECT ... WHERE key = ?`, [param])
         return rows.map(row => row.id)
     }
}

myobs.runWithDB(MyDatabase, __dirname + "/config.json", async (db) => {
    let result = await db.QueryMyThing(12345);
    console.log(result)
})
```
