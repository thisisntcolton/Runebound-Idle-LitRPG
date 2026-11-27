import {Stock,spend,Building,buildings} from './Economy';
export interface StoryData {introSeen?:boolean;hutLevels?:number[];fire:boolean;urga:boolean;hall:number;huts:number;harvests:Stock;production:number;elapsed:number;entries:string[]}
export const freshStory=():StoryData=>({introSeen:false,fire:false,urga:false,hall:0,huts:0,harvests:{wood:0,stone:0,iron:0,food:0},production:0,elapsed:0,entries:[]});
export const hallCosts=[{wood:250,stone:100},{wood:1000,stone:500},{wood:5000,stone:2500,iron:250},{wood:20000,stone:10000,iron:2500},{wood:75000,stone:40000,iron:15000}];
export class StorySystem {
 constructor(public data:StoryData){}
 get capacity(){return 1+(this.data.hutLevels?.length===this.data.huts?this.data.hutLevels.reduce((n,l)=>n+([0,4,6,8,12,20][l]??4),0):this.data.huts*4)+this.data.hall*4;}
 population(workers:Stock){return 1+Number(this.data.urga)+Object.values(workers).reduce((a,b)=>a+b,0);}
 record(text:string){if(!this.data.entries.includes(text))this.data.entries.push(text);}
 restoreFire(s:Stock){if(this.data.fire||!spend(s,{wood:10}))return false;this.data.fire=true;this.record("A fire won't bring the clan back... But it's a start.");return true;}
 hut(s:Stock){if(!this.data.fire||!spend(s,{wood:this.data.huts?300:25}))return false;this.data.huts++;this.record("No Orc can survive alone forever. If there are others out there, they'll need a place to sleep.");return true;}
 recruit(s:Stock){if(!this.data.huts||this.data.urga||!spend(s,{wood:50}))return false;this.data.urga=true;this.record('Urga returns. She teaches Gruk how to forage safely.');return true;}
 hall(s:Stock){if(!this.data.urga||this.data.hall>=5||!spend(s,hallCosts[this.data.hall]))return false;this.data.hall++;this.record(this.data.hall===1?'The Blackroot Tribe once gathered here. One day they will again.':`Great Hall restored to level ${this.data.hall}.`);return true;}
 objective(pick:number,stock:Stock,workers:Stock,built:Building[]){if(!this.data.fire)return 'Build a hut • First restore campfire (10 wood)';if(!this.data.huts)return 'Build a hut • 25 wood';if(!this.data.urga)return 'Welcome Urga • 50 wood';if(this.data.harvests.food<25)return `Forest bounty • ${this.data.harvests.food}/25 food`;if(!pick)return 'Acquire pickaxe • 200 wood';if(!this.data.hall)return 'Restore Great Hall • 100 wood + 50 stone';if(!built.includes('farm'))return 'Build a farm';if(!built.includes('mill'))return 'Build a lumber mill';if(!built.includes('quarry'))return 'Build a quarry';if(this.data.hall<5)return `Restore Great Hall • ${this.data.hall}/5`;if(this.population(workers)<100)return `Bring the tribe home • ${this.population(workers)}/100`;if(Object.keys(buildings).some(b=>!built.includes(b as Building)))return 'Restore remaining buildings';return 'Blackroot lives again.';}
}
