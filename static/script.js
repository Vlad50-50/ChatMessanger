const socket = io();

let form = document.getElementById("fotmMsg");
let inp = document.getElementById("inputMsg");

form.addEventListener("submit",event => {
    event.preventDefault();
    if (inp.value){
        socket.emit("new_message",inp.value);
        inp.value = ""
;    }
})

socket.on("messege", msg => {
    let item = document.createElement("li");
    item.textContent = msg;
    document.getElementById("messages").appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
})