const fs = require('fs');
const Papa = require('papaparse');
const Logger = require('./logger');

async function getUsers(csvFile) {
  return new Promise((resolve, reject) => {
    const csv = fs.createReadStream(csvFile, 'utf8');
    Papa.parse(csv, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      error: (results) => {
        Logger.error({ error: results.errors }, 'Error parsing Assets CSV File');
        reject(results.errors);
      },
      complete: (results, file) => {
        if (results.errors.length > 0) {
          Logger.error({ error: results.errors }, 'Error parsing CSV file');
          reject(results.errors);
        } else {
          resolve(results.data);
        }
      }
    });
  });
}

module.exports = {
  getUsers
};
