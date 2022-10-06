const mariadb = require("mariadb");

const pool = mariadb.createPool({
    connectionLimit: 5,
    host: "localhost",
    user: "root",
    password: "root",
    database: "sample",
    port: 3306
});

pool.getConnection((err, connection) => {
        if(err){
                console.error(err);
        }
        if(connection) connection.release();
        return;

});
module.exports = pool