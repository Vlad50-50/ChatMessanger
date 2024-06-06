const socket = io({
    auth: {
        cookie: document.cookie
    }
});

const messageContainer = document.getElementById("messages");
const input = document.getElementById("inputMsg");
const form = document.getElementById("formMsg");
const myId = document.cookie.split("=")[1].split(".")[0];

form.addEventListener("submit", event => {
    event.preventDefault();
    if (input.value) {
        socket.emit("new_message", input.value);
        createMyMsg({
            content: input.value,
            timestamp: Date.now()
        });
        input.value = "";
    }
});

socket.on("message", msg => {
    createMsg(msg);
});

function createMsg(msg) {
    const item = document.createElement("li");
    item.classList.add("message");
    const sender = document.createElement("span");
    sender.textContent = msg.username;
    const content = document.createElement("div");
    content.classList.add("message");
    content.textContent = msg.content;
    const timestamp = document.createElement("span");
    timestamp.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    item.appendChild(sender);
    item.appendChild(content);
    item.appendChild(timestamp);

    messageContainer.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

function createMyMsg(msg) {
    const item = document.createElement("li");
    item.classList.add("message", "my");
    const content = document.createElement("div");
    content.classList.add("message");
    content.textContent = msg.content;
    const timestamp = document.createElement("span");
    timestamp.textContent = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    item.appendChild(content);
    item.appendChild(timestamp);

    messageContainer.appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

socket.on("all_messages", msgArray => {
    msgArray.forEach(msg => {
        if (msg.author_id == myId) {
            createMyMsg(msg);
        } else {
            createMsg(msg);
        }
    });
});

document.getElementById("logout").addEventListener("click", () => {
    document.cookie = "token=;expires=0";
    location.assign("/login");
});
