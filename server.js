const http = require("http");
const fs = require("fs");
const path = require("path");

const chatHtmlFile = fs.readFileSync(path.join(__dirname,"static","shat.htm"));
const styleCssFile = fs.readFileSync(path.join(__dirname,"static","style.css"));
const scriptJSFile = fs.readFileSync(path.join(__dirname,"static","script.js"));

const server = http.createServe((req,res) => {
    if (req.method == "GET"){
        switch (req.url) {
            case "/" : return res.end(chatHtmlFile);
            case "/style.css" : return res.end(styleCssFile);
            case "/script.js" : return res.end(scriptJSFile);
        }
    }

    return res.end("Error 404");
})

server.listen(3000);