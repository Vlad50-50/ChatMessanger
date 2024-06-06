const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const db = require("./database");
const cookie = require("cookie");

const chatHtmlFile = fs.readFileSync(path.join(__dirname, "static", "chat.html"));
const styleCssFile = fs.readFileSync(path.join(__dirname, "static", "style.css"));
const scriptJsFile = fs.readFileSync(path.join(__dirname, "static", "script.js"));
const loginHtmlFile = fs.readFileSync(path.join(__dirname, "static", "login.html"));
const registerHtmlFile = fs.readFileSync(path.join(__dirname, "static", "register.html"));
const authJsFile = fs.readFileSync(path.join(__dirname, "static", "auth.js"));

const server = http.createServer((req, res) => {
    if (req.method === "GET") {
        switch (req.url) {
            case "/style.css": return res.end(styleCssFile);
            case "/login": return res.end(loginHtmlFile);
            case "/register": return res.end(registerHtmlFile);
            case "/auth.js": return res.end(authJsFile);
            default: return guarded(req, res);
        }
    }
    if (req.method === "POST") {
        switch (req.url) {
            case "/api/register": return registerUser(req, res);
            case "/api/login": return login(req, res);
        }
    }

    return res.end("Error 404");
});

async function registerUser(req, res) {
    let data = "";
    req.on("data", (chunk) => {
        data += chunk;
    });
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            if (!user.login || !user.password) {
                return res.end(JSON.stringify({
                    error: "Empty login or password"
                }));
            }
            if (await db.isUserExist(user.login)) {
                return res.end(JSON.stringify({
                    error: "User already exists"
                }));
            }
            await db.addUser(user);
            return res.end(JSON.stringify({
                res: "Registration is successful"
            }));
        } catch (error) {
            return res.end(JSON.stringify({
                error: error.toString()
            }));
        }
    });
}

let validateAuthToken = [];

async function login(req, res) {
    let data = "";
    req.on("data", (chunk) => {
        data += chunk;
    });
    req.on("end", async () => {
        try {
            const user = JSON.parse(data);
            const token = await db.getAuthToken(user);
            validateAuthToken.push(token);
            res.writeHead(200, {
                'Set-Cookie': cookie.serialize('token', token, { httpOnly: true })
            });
            res.end(JSON.stringify({
                token: token
            }));
        } catch (error) {
            res.writeHead(400);
            return res.end(JSON.stringify({
                error: error.toString()
            }));
        }
    });
}

server.listen(3000);

const io = new Server(server);

io.use((socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    const creds = getCredentials(cookies.token);
    if (!creds) {
        next(new Error("No auth"));
    } else {
        socket.credentials = creds;
        next();
    }
});

function getCredentials(token = '') {
    if (!token || !validateAuthToken.includes(token)) return null;
    const [userId, login] = token.split(".");
    if (!userId || !login) return null;
    return { userId, login };
}

function guarded(req, res) {
    const cookies = cookie.parse(req.headers.cookie || '');
    const creds = getCredentials(cookies.token);
    if (!creds) {
        res.writeHead(302, { "Location": "/login" });
        return res.end();
    }
    if (req.method === "GET") {
        switch (req.url) {
            case "/": return res.end(chatHtmlFile);
            case "/script.js": return res.end(scriptJsFile);
        }
    }
}

io.on("connection", async (socket) => {
    console.log("A user connected. Id - " + socket.id);
    let username = socket.credentials?.login;
    let userId = socket.credentials?.userId;
    let messages = await db.getMessages();
    socket.emit("all_messages", messages);

    socket.on("new_message", async (message) => {
        await db.addMessage(message, userId);
        let obj = {
            username: username,
            content: message,
            userId: userId,
            timestamp: new Date().toISOString()
        };
        socket.broadcast.emit("message", obj);
    });
});
