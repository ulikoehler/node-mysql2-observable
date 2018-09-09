# mysql2-observable
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
const { AbstractMySQLDatabase, runWithDB } = require("mysql2-observable");
const { map } = require("rxjs/operators");

class MyDatabase extends AbstractMySQLDatabase {
     async QueryMyThing(param) {
         let [rows, fields] = await this.Query(`
             SELECT ... WHERE key = ?`, [param])
         return rows.pipe(map(row => row.id))
     }
}

runWithDB(MyDatabase, __dirname + "/config.json", async (db) => {
    let result = await db.QueryMyThing(12345);
    console.log(result)
});
```

Within the `MyDatabase` class, you can use `this.Query()`, `this.Execute()` equivalently to the respective `mysql2` calls. Also, you can use `this.QueryObservable()`, which we'll cover in the next section. 

### Using `Observable` to auto-paginate queries

For this example, we're assuming that you've created `config.json`
and you've setup the following table:

```sql
CREATE TABLE `testtable` (`val` int(11) NOT NULL);
INSERT INTO `testtable` (`val`) VALUES (1), (2), (3), (4), (5);
```

Then, you can use `db.QueryObservable()` just like `db.Query`.

```js
const { AbstractMySQLDatabase, runWithDB } = require("mysql2-observable");
const { map } = require("rxjs/operators");
const { do } = require("rxjs/operators");
const { ignoreElements } = require("rxjs/operators");
const { toPromise } = require("rxjs/operators");

class MyDatabase extends AbstractMySQLDatabase {
     ListValues(param) {
         return this.QueryObservable("SELECT * FROM testtable").pipe(
            map(row => row.val),
            do(val => console.log(val)), // For each value
            ignoreElements(), // Return no values in the Promise
            toPromise()
         )
     }
}

runWithDB(MyDatabase, __dirname + "/config.json", async (db) => {
    /*
     * Prints
     * 1
     * 2
     * 3
     * 4
     * 5
     */
    await db.ListValues()
});
```

This works internally by inserting a `LIMIT ?,?` string at the end of the statement and modifying the offset for each page until no values are left. All values are inserted into the `Observable` synchronously, so you won't run out of memory easily even for huge tables.

The default page size is `10000`, but you can modify that by using a different value in the third argument of `db.QueryObservable()`. It is recommended to increase this value for very small result rows and decrease it for very large result rows.

Note that in order to avoid having the query still running when the connection is closed (after the `async` callback to `runWithDB` is finished, the connection pool is closed), we need to convert the `Observable` to a `Promise` using `toPromise()`.
Also note that the member function is not declared `async` because it doesn't contain any `await` statements, but it acts like an `async` function as it returns a `Promise` and can therefore be `await`ed. This is not a requirement relating to `QueryObservable`, if you do some postprocessing outside the `Observable` chain, you can `await` the `Promise` which you converted the `Observable` into and postprocess it in an `async` member function.

One example of this would be to take the sum of the integers in the table:

```js
const { AbstractMySQLDatabase, runWithDB } = require("mysql2-observable");
const { map } = require("rxjs/operators");
const { toArray } = require("rxjs/operators");
const { toPromise } = require("rxjs/operators");


class MyDatabase extends AbstractMySQLDatabase {
     async ListValues(param) {
         const result = await this.QueryObservable(
            "SELECT * FROM testtable").pipe(
             map(row => row.val),
             toArray(), // Collect all values into an array: [1,2,3,4,5]
             toPromise()
         )
         // Postprocess
         let sum = 0;
         for(const val of result) {
            sum += val;
         }
         return sum
     }
}

runWithDB(MyDatabase, __dirname + "/config.json", async (db) => {
    /*
     * Prints
     * 15
     */
    console.log(await db.ListValues());
});
```

For more information on what you can do with `Observable`s, see the [RxJS](http://reactivex.io/rxjs/) documentation.
