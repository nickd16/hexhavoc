import {Tile, Board } from "./board";
import { Unit } from "./occupants";
export {Occupant,Terrain,Primary,Blockage,Divot,Fog,Piece,King, Unit,Grunt,Major}
class Card {
    constructor(bcid){
        this.spawns; //Unit
        this.image;
        this.text;
        this.name;
        this.igcid;
        this.bcid = bcid;
        this.owner;
    }
    get cost(){
        return this.spawns instanceof Major ? 5 : (this.spawns instanceof Grunt ? 3 : 2);
    }
}



class Player {
    constructor(pid,deck){
        this.pid = pid;
        this.name = "Player";
        this.pfp = "https://i.redd.it/t20nfsv8guwe1.jpeg";
        this.hand = [];
        this.deck = deck;
        this.energy;
        this.game;
        this.client;
    }
    deploy(card = new Card(),tile=new Tile()){
        let idx = -1;
        this.hand.forEach((c,i)=> c==card ? idx=i : 0)
        if (idx < 0) return {good:false,details:"Invalid card chosen"};
        if (tile.occupant) return {good:false, details:"Target tile is occupied"};
        if (card.cost > this.energy) return {good:false, details:"Not enough energy"};
        this.hand.splice(idx,1);
        if (card.spawns instanceof Unit) tile.occupant = card.spawns;
       else card.spawns.operate();
    }   
}

class Game {
    constructor(server,p1,p2){
        this.players = [p1,p2];
        this.board = new Board();
        this.turn = 0;
        this.whoseTurn = 0;
        this.lcid = 0;
        this.lpid = 0;
        this.server;
    }
    insertCard(bcid,location = []){
        let bc =new Card(bcid);
        location.push()
    }
}