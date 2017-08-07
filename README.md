# node-mysql2-observable
Convenient access to promise-based node-mysql2 using rxjs Observables and various ES6 features.

### AbstractMySQLDatabase example
Provides convenient & safe database object lifecycle management.

```js
class MyDatabase extends AbstractMySQLDatabase {
     async QueryMyThing(param) {
         let [rows, fields] = await this.conn.query(`
             SELECT ... WHERE key = ?`, [param])
         return rows.map(row => row.id)
     }
}

runWithDB(MyDatabase, "config.json", async (db) => {
    let result = db.QueryMyThing(12345);
    console.log(result)
})
```
