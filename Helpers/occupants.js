class Occupant {
    constructor(){
       this.tile; 
       this.igoid;
       this.board;
    }
    moveTo(tile){
        this.tile = tile;
    }
}
/*                                       */
class Terrain extends Occupant {
    constructor() {
        this.TR;
    }
}

class Primary extends Terrain {

}
class Blockage extends Terrain {

}
class Divot extends Terrain {

}
class Fog extends Terrain {

}
/*                                       */
class Piece extends Occupant {
    constructor() {
        this.HP = 40;
        this.ATK = 10;
        this.MS = 2;
        this.TR = 2;
        this.R = 2;
        this.owner; //Player
        this.performedAction;
        this.activatedAbility;
    }
}
class King extends Piece {
    constructor(){
        this.HP = 100;
        this.ATK = 40;
        this.MS = 1;
        this.TR = 5;
        this.R = 1;
    }
}
class Unit extends Piece {
    constructor(){
        this.name;
        this.abil; //Effect
        this.static; 
        this.class; //"Bulky", "Sneaky"...
        this.bcid
    }
}
class Grunt extends Unit {
    constructor(){}
}
class Major extends Unit {
    constructor(){
        this.ultCost;
        this.ult;
    }
}
/*                                       */

export {Occupant,Terrain,Primary,Blockage,Divot,Fog,Piece,King, Unit,Grunt,Major}