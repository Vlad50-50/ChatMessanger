const fs = require("fs");
const dbFile = "./chat.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;
let crypto = require("crypto");

dbWrapper.open({
    filename: dbFile,
    driver: sqlite3.Database
}).then(async dBase => {
    db = dBase;
    try {
        if (!exists) {
            await db.run(
                `CREATE TABLE user (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    login VARCHAR(40) UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    salt TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );`
            );
            await db.run(
                `CREATE TABLE message (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    author_id INTEGER NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(author_id) REFERENCES user(id)
                );`
            );
        } else {
            await addColumnIfNotExists('user', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            await addColumnIfNotExists('message', 'timestamp', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
            console.log(await db.all("SELECT * FROM user"));
        }
    } catch (error) {
        console.error(error);
    }
});

async function addColumnIfNotExists(tableName, columnName, columnDefinition) {
    const checkColumnQuery = `PRAGMA table_info(${tableName});`;
    const existingColumns = await db.all(checkColumnQuery);
    const columnNames = existingColumns.map(column => column.name);
    if (!columnNames.includes(columnName)) {
        const alterQuery = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`;
        await db.run(alterQuery);
    }
}

module.exports = {
    getMessages: async () => {
        return await db.all(`
            SELECT message.id AS msg_id, author_id, content, login, timestamp FROM message 
            JOIN user ON message.author_id = user.id
        `);
    },
    addMessage: async (msg, userid) => {
        try {
            const timestamp = new Date().toISOString();
            const user = await db.get(`SELECT login FROM user WHERE id = ?`, [userid]);
            console.log(`Message from ${user.login} at ${timestamp}: ${msg}`);
            await db.run(`INSERT INTO message (content, author_id, timestamp) VALUES (?, ?, ?)`, [msg, userid, timestamp]);
        } catch (error) {
            console.log(error);
        }
    },
    isUserExist: async (login) => {
        let person = await db.all(`SELECT * FROM user WHERE login = ?`, [login]);
        return person.length;
    },
    addUser: async (user) => {
        let salt = crypto.randomBytes(16).toString("hex");
        let passCipher = crypto.pbkdf2Sync(user.password, salt, 1000, 100, 'sha512').toString("hex");
        await db.run(
            `INSERT INTO user (login, password, salt) VALUES (?, ?, ?)`,
            [user.login, passCipher, salt]
        );
    },
    getAuthToken: async (user) => {
        let person = await db.all(`SELECT * FROM user WHERE login = ?`, [user.login]);
        if (!person.length) {
            throw "Incorrect login";
        }
        const { id, login, password, salt } = person[0];
        const hash = crypto.pbkdf2Sync(user.password, salt, 1000, 100, 'sha512').toString("hex");
        if (hash != password) {
            throw "Incorrect password";
        }
        return id + "." + login + "." + crypto.randomBytes(20).toString("hex");
    }
};
