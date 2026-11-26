export const classes = {
 Fighter:{stats:[16,12,16,8,10,12],skills:['athletics','intimidation'],abilities:['Shield Bash','Guard','Heavy Strike']},
 Cleric:{stats:[10,10,14,12,16,14],skills:['medicine','persuasion'],abilities:['Mend','Bless','Smite']},
 Rogue:{stats:[10,17,12,14,10,12],skills:['stealth','lockpicking'],abilities:['Backstab','Evade','Poison Blade']},
 Ranger:{stats:[12,16,13,10,15,8],skills:['survival','perception'],abilities:['Aimed Shot','Mark','Volley']},
 Wizard:{stats:[8,12,12,18,13,10],skills:['investigation','arcana'],abilities:['Firebolt','Frost','Arcane Burst']}
};
export const skills={athletics:0,intimidation:5,medicine:4,persuasion:5,stealth:1,lockpicking:1,survival:4,perception:4,investigation:3,arcana:3};
export const enemies={wolf:[35,12,2,14],scout:[40,13,3,13],guard:[65,15,8,9],archer:[42,16,3,15],hound:[48,15,4,16],cultist:[50,17,4,10],shade:[55,19,5,14],warden:[125,21,10,11]};
export const items=Array.from({length:20},(_,i)=>({id:i,name:['Iron Sword','Oak Staff','Hunting Bow','Steel Dagger','War Hammer','Leather Coat','Chain Vest','Scout Cloak','Iron Helm','Ward Robe'][i%10]+(i>=10?' of the Hollow':''),slot:i%10<5?'weapon':'armor',rarity:['Common','Uncommon','Rare','Epic'][Math.floor(i/5)],bonus:2+Math.floor(i/5)*2}));
