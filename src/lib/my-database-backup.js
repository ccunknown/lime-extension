const { Database } = require(`gateway-addon`);

class myDatabase extends Database {
  loadThings() {
    if (!this.conn) {
      return Promise.reject(new Error(`Database not open`));
    }

    return new Promise((resolve, reject) => {
      this.conn.all("SELECT * FROM things", [], (error, rows) => {
        if (error) reject(error);
        else resolve(rows || {});
      });
    });
  }
}

module.exports = myDatabase;
