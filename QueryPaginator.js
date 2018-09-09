const mysql = require('mysql2/promise');
const Rx = require('rxjs/Rx');

/**
 * Wrapper around a SQL statement that auto-paginates using LIMIT
 * statements and emits the resulting rows into an observable
 * asynchronously.
 */
class ObservableQueryPaginator {
    /**
     * Construct a new QueryPaginator for a given statement.
     * Auto-appends " LIMIT ?, ?" to the end of SQL,
     * and automatically sets the parameters accordingly.
     *
     * @param conn: The mysql2 connection to use
     * @param sql: The statement to use, not including any LIMIT statements
     * @param params: The parameter array for the statement (replaces ?s in sql)
     * @param pagesize: How many entries shall be fetched at once.
     */
    constructor (conn, sql, params = [], pagesize = 10000) {
        this.conn = conn;
        this.sql = sql + ' LIMIT ?, ?';
        this.offset = 0;
        this.pagesize = pagesize;
        // Append offset, pagesizeidx to the parameter array
        this.offsetIdx = params.length;
        this.params = params;
        this.params.push(this.offset);
        this.params.push(pagesize);
    }

    /**
     * Get an observable that continues to emit
     * rows until no more rows are returned.
     */
    Query () {
        return Rx.Observable.create((observer) => {
            this._fetchNext(observer).catch((err) => observer.error(err));
        });
    }

    /**
     * Internal function, do not call externally.
     */
    async _fetchNext (observer) {
        // Set new offset
        this.params[this.offsetIdx] = this.offset;
        let [rows, fields] = await this.conn.query(this.sql, this.params);
        if (rows.length == 0) {
            observer.complete();
        } else {
            // Process current data
            for (var row of rows) {
                observer.next(row);
            }
            // Continue with next page
            this.offset += this.pagesize;
            await this._fetchNext(observer);
        }
    }
}

module.exports = {
    ObservableQueryPaginator: ObservableQueryPaginator
};
