import {Player} from '../entities/Player';import {Camp} from '../entities/Camp';
export class UpgradeSystem {static cost(level:number){return level===1?25:level===2?50:null;}static buy(p:Player,c:Camp){const cost=this.cost(p.axeLevel);if(cost===null||c.storage<cost)return false;c.storage-=cost;p.axeLevel++;return true;}}
