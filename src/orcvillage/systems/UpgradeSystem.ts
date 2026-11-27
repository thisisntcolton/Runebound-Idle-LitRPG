import {Player} from '../entities/Player';import {Camp} from '../entities/Camp';import {toolCost,spend} from './Economy';
export class UpgradeSystem {static buy(p:Player,c:Camp,tool:'axeLevel'|'pickaxeLevel'){const cost=p[tool]===0?{wood:200}:toolCost(p[tool]);if(!cost||!spend(c.storage,cost))return false;p[tool]++;return true;}}
