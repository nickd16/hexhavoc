const {Server} = require('../serverside.js');
import { Piece,Terrain,Grunt,Unit,King, Occupant } from './occupants.js';

function split(str=""){
    sf = [];
    cur = ""
    let depth = 0;
    for (let i = 0; i <str.length; i++){
        if (str[i] == " " && !depth) {
            if (cur.length) sf+= cur;
            cur = "";
        }else if (str[i] == "("){
            if (depth) cur+="(";
            depth+=1;
        }else if (str[i]==")"){
            depth--;
            if (depth) cur+=")";   
        }else cur+= str[i];
    }
    if (depth) console.error("Unclosed parent when splitting /*  " + str + "  */ but continuting anyways")
    if (cur.length) sf.push(cur);
    return sf;
}
class Effect {
    constructor(steps=[""]){
        this.steps = steps;
        this.game;
        this.player;
        this.piece //if it applies
        this.env = {};
    };
    parsePiece(str="") {
        if (str == "[piece]" && this.piece) return this.piece;
        else if (Number(str)) return this.game.getPieceById(Number(str));
        else if (this.env[str] && this.env[str] instanceof Piece) return this.env[str];
        return false;
    }
    parseTile(str=""){
        if (str.substring(0,6) == "tileOf"){
            let X = this.parsePiece(str.substring(7));
            if (X) return X.tile;
        }
    }
    parseNum(){

    }
    parseFilter(){

    }

    async parseStep(step=""){
        tokens =  split(step);
        if (tokens[0] == "input"){ //ex: input (Tile|distance(SEL tileOf:[piece])< 1) as adj
            let z = new Server();
            let [dtype,filter] = tokens[1]
            filter = filter || "true"; 
            let SEL = await new Promise(X => z.request(this.player.client,"select",{dtype,filter},data=>X(data)))
            if (tokens[2] == "as"){
                if (eval(filter)){
                    this.env[tokens[3]] = SEL;
                    return true;
                }else return false;
            }
        }else if (tokens[0] == "move"){ //ex: move [piece] to adj  
            let target = tokens[1];
            let to = tokens[2];
            let spot = tokens[3];
            let piece = this.parsePiece(target);
            let tile = this.parseTile(spot);
            if (!piece) return false;
            if (!tile) return false;
            if (to == "to"){
                piece.moveTo(tile);
            }
            
        }
        
    }

    async run(){
        for (let i = 0; i < this.steps.length(); i++){
            
        }
    }
}

export {Effect}