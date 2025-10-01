const url = require("url");
const fs = require('fs');
const path = require('path');
const WS = require("ws");
const contentTypes = {
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'gif': 'image/gif'
}
const ERRORCODES = {
    internal:   1011,
    badReq:     1003,
    authFail:   1008,  
    timeOut:    1001,  
    noError:    1000 
}
class Client {
    constructor(id, data){
        this.id = id;
        this.data = data; //used for username, accid, wtvr else you need
        this.WSL = []; //client websocket list
        this.connectedTo = false;
        this.disconnector = false;
        this.inRooms = [];
        this.handlers = {};
        this.multiConnectionHandler = (ws,qP)=>{
            this.connect(ws);
        }
    }

    send(eventType,data){
        this.WSL.forEach(ws => ws.send(JSON.stringify({event:eventType,data:data})));
    }
    setHandler(eventType,processer){ //handles events from the client
        this.handlers[eventType] = (data) =>processer(data);
    }

    disconnect(ws){
        this.WSL = this.WSL.filter(w=> w!= ws);
        if (this.WSL.length == 0) return 1;
        return 0;
    }

    connect(ws){
        this.WSL.push(ws)
        ws.on('message',(msg) =>{
            let dta = JSON.parse(msg);
            if (this.handlers[dta.event]) this.handlers[dta.event](dta.data);
            else if (this.connectedTo.clientResponders[dta.event] && dta.returnPoint) this.connectedTo.clientResponders[dta.event](this,dta.data,dta.returnPoint);
            else if (this.connectedTo.clientHandlers[dta.event]) this.connectedTo.clientHandlers[dta.event](this,dta.data);
            else console.warn("Invalid event called: ", dta.event);
        })
        ws.on('close',()=> {
            if (this.disconnect(ws)) this.connectedTo.disconnect(this);
        } )
        ws.on('error', (error) => {
            console.error(`[SERVER] WebSocket error for ${this.id}:`, error);
        });
    }
    
}



class Room {
    constructor(id){
        this.clients = [];//list of clients
        this.history = []; //list of event history
        this.depth = 10; //the number of events to store in history;
        this.roomInfo = {id};
        this.server;
        this.handlers = {}
    }
    addClient(CL){
        CL.send("roomJoin", this.roomInfo);
        CL.inRooms.push(this);
        this.clients.push(CL);
    }
    remClient(CL){
        CL.send("roomKick", this.roomInfo);
        this.clients = this.clients.filter(c => c != CL);
        CL.inRooms = CL.inRooms.filter(c => c != CL);
    }
    forward(CL, eventType,msgData,persists = 1, reflect = 1) {
        if (!CL || this.clients.includes(CL)){
            if (persists){
                this.history.push({event:eventType,data:msgData});
                if (this.history.length > this.depth) this.history.shift();
            }
            if (reflect){
                this.clients.forEach(c => c.send(eventType,msgData));
            }else {
                this.clients.forEach(c =>  (c != CL) ? c.send(eventType,msgData) : 0);
            }
        }else {
            console.warn("Client attempted to sent message to locked room!")
        }
    }
    close(reason){
        this.forward(false, "roomclose",reason);
        this.clients.forEach(cl=> cl.inRooms = cl.inRooms.filter(r=> r != this));
        delete this.server.rooms[this.roomInfo.id];

    }
    setHandler(eventType, processer){
        this.handlers[eventType] = (cl, data) => processer(cl, data);
    }
    invokeHandler(eventType,CL,data){
        if (!this.clients.includes(CL)) return console.warn("Client attempted to invoke handler to locked room!");
        if (this.handlers[eventType]) return this.handlers[eventType](CL,data);
        console.warn("No handler of type " + eventType + " was found");
    }
}


class Server {
    constructor(port=8000,secureOptions=null){
        this.roomIDCounter = 0;
        this.clients = {};
        this.clientHandlers = {};
        this.clientResponders = {};
        this.activeRequests = 0;
        this.app = require("express")();
        this.port = port
        if (secureOptions) ;
        else this.main = this.app.listen(port);
        this.rooms = {};
        this.wss = new WS.Server({ server:this.main });
        this.clientAdded = (client,websocket, queryParams)=>{
            client.connect(websocket);
            this.clients[queryParams.clientID] = client;
        };
        this.disconnect =  (CL) => {
            CL.inRooms.forEach(room => {
               room.clients =  room.clients.filter(c => c != CL);
            })      
            delete this.clients[CL.id];
            this.clients[CL.id]=null;
        }
        this.rooms = {};
        this.authConnection = async (ws, qP)=>{return true;};
        this.wss.on('connection', async (ws,req)=>{
            let parsedUrl = url.parse(req.url, true);
            let qP = parsedUrl.query;
            if (!qP.clientID) return ws.close(ERRORCODES.badReq);
            if (!(await this.authConnection(ws, qP))) return ws.close(ERRORCODES.authFail);
            let cli = this.clients[qP.clientID];
            if (cli){
                if (cli.multiConnectionHandler) {
                    cli.multiConnectionHandler(ws,qP);
                    ws.send(JSON.stringify({event:"Websocket_READY"}));
                }else {
                    return ws.close(ERRORCODES.badReq);
                }
            }else {
                cli = new Client(qP.clientID,{})
                cli.connectedTo = this;
                this.clientAdded(cli,ws,qP);
                ws.send(JSON.stringify({event:"Websocket_READY"}));
            }
        })
        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }
    request(client, requestType,requestData, whenFinished = (data,ercode)=>{}, timeout = 10000){
        this.activeRequests++;
        let hname =  client.id  + "tm" + Date.now() +  "___REQUESTS___" + this.activeRequests;
        client.WSL.forEach(ws=> 
            ws.send(JSON.stringify({event:requestType,data:requestData, returnPoint: hname}))
        )
        let timeoutError = setTimeout(() => {
            if (this.clientHandlers[hname]) {
                delete this.clientHandlers[hname];
                this.activeRequests--;
                console.warn(`${requestType}: ${hname} timed out after ${timeout}ms`);
                whenFinished({},ERRORCODES.timeOut);
            }
        }, timeout); 
        
        this.clientHandlers[hname] = (data)=>{
            clearTimeout(timeoutError);
            this.activeRequests--;
            delete this.handlers[hname];
            return whenFinished(data,ERRORCODES.noError);
        }
    }


    getClientsWith(pred){
        let sf = []
        for (let {key,value} in  Object.entries(this.clients)){
            if (pred(value)) sf.push(value);
        }
        return sf;
    }

    newRoom(){
        let id = Math.floor(Math.random()*9000000 + 1000000) + "x" + Date.now() +  "R" + this.roomIDCounter;
        this.rooms[id] = new Room(id);
        this.rooms[id].server = this; 
        this.roomIDCounter = (this.roomIDCounter + 1) & 0xffff;
        return this.rooms[id];
    }
    setClientHandler(eventType,fn){
        this.clientHandlers[eventType] = (client, data) => fn(client, data);
    }
    setClientResponder(requestType,processer) {
        this.clientResponders[requestType] = (client, data,returnPoint) => {
            client.send(returnPoint, processer(client,data));
        }
    }

    addFile(clientPath,serverPath,fileType="txt", auth = (req, res) => true){
        let contentType = contentTypes[fileType] || "txt/plain"
        this.app.get(clientPath, (req, res) => {
            if (!auth(req, res)) return res.status(200).send("Invalid Permissions");
            fs.access(serverPath, fs.constants.R_OK, (err) => {
                if (err) {
                    res.status(404).send('File not found');
                    return;
                }
                res.setHeader('Content-Type', contentType);
                fs.createReadStream(serverPath).pipe(res);
            });
        });        
    }
}

async function sleep(ms) {
    return await new Promise(x=>setTimeout(x,ms));
} 


module.exports = {fs, url, path, WS, contentTypes, ERRORCODES,Client,Room,Server, sleep};


