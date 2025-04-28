require("dotenv").config()

module.exports = {
   development: {
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: "mariadb",
   },
   test: {
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: "mariadb", // 또는 'mysql'
   },
   production: {
      username: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      dialect: "mariadb", // 또는 'mysql'
   },
}

// npx sequelize-cli init 말고 동적 설정 env사용하기 위함(루트디렉토리에서)
// npx sequelize-cli db:migrate --config config/config.js
// npx sequelize-cli db:migrate;
