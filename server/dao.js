'use strict';

const sqlite = require('sqlite3');
const dayjs = require('dayjs');
const crypto = require('crypto');

// open the database
const db = new sqlite.Database('CMSmall.sqlite', (err) => {
  if (err) throw err;
});

// get all pages. 
exports.listPages = () => {
  return new Promise((resolve, reject) => {
    const sql1 = 'SELECT pages.id,title,name AS author,users.id AS authorId,creationDate, publishDate FROM pages JOIN users ON pages.authorId = users.id ';
    db.all(sql1, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const pages = rows.map((e) => ({ id: e.id, title: e.title, author: e.author, authorId: e.authorId, creationDate: dayjs(e.creationDate), publishDate: e.publishDate ? dayjs(e.publishDate) : '', blocks_array: [] }));

      const sql2 = 'SELECT * FROM content_blocks ';
      db.all(sql2, [], (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        const blocks = rows.map((e) => ({ id: e.id, pageId: e.pageId, type: e.type, orderIndex: e.orderIndex, content: e.content, imagePath: e.imagePath }));
        blocks.forEach((block) => {
          const paginaTrovata = pages.find((page) => page.id === block.pageId);
          if (paginaTrovata) {
            paginaTrovata.blocks_array.push(block);
          }
        });
        resolve(pages);
      });
    });
  });
}

//per vedere se quella inserita sul client è realmente l'idPagina giusta per il blocco
exports.getPage = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT pages.id,title,name AS author,users.id AS authorId,creationDate, publishDate FROM pages JOIN users ON pages.authorId = users.id WHERE pages.id = ?'; //cosi hai tutti i campi + il campo nome dell'authorId!!
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve({ error: 'Page not found.' });
      } else {
        const page = { id: row.id, title: row.text, author: row.author, authorId: row.authorId, creationDate: dayjs(row.creationDate), publishDate: row.publishDate ? dayjs(row.publishDate) : '' }; //con questa restituisci anche il nome dell'autore!!
        resolve(page);
      }
    });
  });
};

// get all images
exports.listImages = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM images';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const images = rows.map((e) => ({ id: e.id, imagePath: e.imagePath }));
      resolve(images);
    });
  });
};

exports.getTitle = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM title';
    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      if (row == undefined) {
        resolve({ error: 'Title not found.' });
      } else {
        const title = { id: row.id, titleName: row.titleName };
        resolve(title);
      }
    });
  });
};

// get all authors(users)
exports.listAuthors = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, email, name FROM users';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      const authors = rows.map((e) => ({ id: e.id, email: e.email, name: e.name }));
      resolve(authors);
    });
  });
};

exports.createBlock = (block) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO content_blocks (pageId, type, orderIndex, content, imagePath) VALUES(?, ?, ?, ?, ?)';
    db.run(sql, [block.pageId, block.type, block.orderIndex, block.content, block.imagePath], function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
};

// add a new page
exports.createPage = (page) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO pages(title, authorId, creationDate, publishDate) VALUES(?, ?, DATE(?), DATE(?))';
    db.run(sql, [page.title, page.authorId, page.creationDate, page.publishDate], function (err) {
      if (err) {
        reject(err);
        return;
      }
      const pageId = this.lastID;
      // Utilizza Promise.all per eseguire tutte le query dei blocchi di contenuto
      const blockPromises = page.blocks_array.map((block) => {
        const sql1 = 'INSERT INTO content_blocks (pageId, type, orderIndex, content, imagePath) VALUES(?, ?, ?, ?, ?)';
        return new Promise((resolveBlock, rejectBlock) => {
          db.run(sql1, [pageId, block.type, block.orderIndex, block.content, block.imagePath], function (err) {
            if (err) {
              rejectBlock(err);
              return;
            }
            resolveBlock(this.lastID);
          });
        });
      });
      // Attendiamo il completamento di tutte le query dei blocchi di contenuto
      Promise.all(blockPromises)
        .then((blockIds) => {
          resolve({ pageId, blockIds });
        })
        .catch((err) => {
          reject(err);
        });
    });
  });
};


exports.updatePage = (page, user) => {
  return new Promise((resolve, reject) => {
    let updateSql;
    if (user.administrator) {
      updateSql = 'UPDATE pages SET title=?, creationDate=DATE(?), publishDate=DATE(?), authorId=? WHERE id = ?';
    } else {
      updateSql = 'UPDATE pages SET title=?, creationDate=DATE(?), publishDate=DATE(?) WHERE id = ? AND authorId = ?';
    }
    const deleteSql = 'DELETE FROM content_blocks WHERE pageId = ?';
    const insertSql = 'INSERT INTO content_blocks (pageId, type, orderIndex, content, imagePath) VALUES(?, ?, ?, ?, ?)';
    let updateParams;
    if (user.administrator) {
      updateParams = [page.title, page.creationDate, page.publishDate, page.authorId, page.id];
    } else {
      updateParams = [page.title, page.creationDate, page.publishDate, page.id, user.id];
    }

    db.run(updateSql, updateParams, function (err) {
      if (err) {
        reject(err);
        return;
      }

      // Delete existing content blocks
      db.run(deleteSql, [page.id], function (err) {
        if (err) {
          reject(err);
          return;
        }

        // Insert new content blocks
        const insertPromises = page.blocks_array.map(block => {
          return new Promise((resolve, reject) => {
            db.run(insertSql, [block.pageId, block.type, block.orderIndex, block.content, block.imagePath], function (err) {
              if (err) {
                reject(err);
                return;
              }
              resolve(this.lastID);
            });
          });
        });

        // Wait for all insert queries to complete
        Promise.all(insertPromises)
          .then(results => {
            resolve(results);
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  });
};

// update title
exports.updateTitle = (title, user) => {
  if (user.administrator) {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE title SET titleName=? WHERE id = ? ';
      db.run(sql, [title.titleName, title.id], function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.changes);
      });
    });
  }
};


// delete an existing page
exports.deletePage = (id, user) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM pages WHERE id = ? AND authorId = ?';  // Double-check that the answer belongs to the userId
    const sql2 = 'DELETE FROM pages WHERE id = ?';
    if (!user.administrator) {
      db.run(sql, [id, user.id], function (err) {
        if (err) {
          reject(err);
          return;
        } else
          resolve(this.changes);  // return the number of affected rows
      });
    }
    else {
      db.run(sql2, [id], function (err) {
        if (err) {
          reject(err);
          return;
        }
      });
    }

    const sql1 = 'DELETE FROM content_blocks WHERE pageId = ? ';
    db.run(sql1, [id], function (err) {
      if (err) {
        reject(err);
        return;
      } else
        resolve(this.changes);
    });
  });
}

// get all users
exports.listUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, email, name FROM users';

    db.all(sql, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const users = rows.map((e) => (
        {
          id: e.id,
          email: e.email,
          name: e.name,
        }));

      resolve(users);
    });
  });
};

//funzioni che erano in userDao

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE id = ?'; //dalla funzione serialize non usi la mail ma usi l'id dello user come identificativo unico! Non sarà mostrato in chiaro
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      else if (row === undefined)
        resolve({ error: 'User not found.' });
      else {
        // by default, the local strategy looks for "username": not to create confusion in server.js, we can create an object with that property
        const user = { id: row.id, username: row.email, name: row.name, administrator: row.administrator }
        resolve(user);
      }
    });
  });
};

exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) { reject(err); }
      else if (row === undefined) { resolve(false); }
      else {
        const user = { id: row.id, username: row.email, name: row.name, administrator: row.administrator };

        const salt = row.salt;
        crypto.scrypt(password, salt, 32, (err, hashedPassword) => { //vuoi che la funzione di hash sia di 32 bit
          if (err) reject(err);

          const passwordHex = Buffer.from(row.password, 'hex');

          if (!crypto.timingSafeEqual(passwordHex, hashedPassword))
            resolve(false);
          else resolve(user);
        });
      }
    });
  });
};