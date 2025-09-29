const {fs, url, path, WS, contentTypes, ERRORCODES,Client,Room,Server, sleep} = require('./serverside.js');

let server = new Server(5000);
console.log("http://localhost:5000")
server.addFile("/","./Client/index.html","html");
server.addFile("/style.css","./Client/style.css","css");
server.addFile("/main.js","./Client/main.js","js");



