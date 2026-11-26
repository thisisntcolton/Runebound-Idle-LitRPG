// SRD 5.1, Races, pp. 3–8. Traits not yet automated are reference text.
export const races={
 Human:{bonus:[1,1,1,1,1,1],speed:30,traits:'Common and one extra language'},
 'Hill Dwarf':{bonus:[0,0,2,0,1,0],speed:25,hp:1,traits:'Darkvision; Dwarven Resilience; combat training; tool proficiency; Stonecunning; Dwarven Toughness'},
 'High Elf':{bonus:[0,2,0,1,0,0],speed:30,skills:['perception'],traits:'Darkvision; Fey Ancestry; Trance; elf weapon training; wizard cantrip; extra language'},
 'Lightfoot Halfling':{bonus:[0,2,0,0,0,1],speed:25,small:true,traits:'Lucky; Brave; Halfling Nimbleness; Naturally Stealthy'},
 Dragonborn:{bonus:[2,0,0,0,0,1],speed:30,traits:'Draconic Ancestry; breath weapon; damage resistance'},
 'Rock Gnome':{bonus:[0,0,1,2,0,0],speed:25,small:true,traits:'Darkvision; Gnome Cunning; Artificer’s Lore; Tinker'},
 'Half-Elf':{bonus:[0,0,0,0,0,2],speed:30,traits:'Darkvision; Fey Ancestry; Skill Versatility; extra language'},
 'Half-Orc':{bonus:[2,0,1,0,0,0],speed:30,skills:['intimidation'],traits:'Darkvision; Menacing; Relentless Endurance; Savage Attacks'},
 Tiefling:{bonus:[0,0,0,1,0,2],speed:30,traits:'Darkvision; Hellish Resistance; Infernal Legacy'}
};
export function racialBonus(name,choices=[0,2]){const b=[...(races[name]||races.Human).bonus];if(name==='Half-Elf'){if(choices.length!==2||new Set(choices).size!==2||choices.some(i=>!Number.isInteger(i)||i<0||i>4))throw Error('Choose two different non-Charisma abilities');for(const i of choices)b[i]++;}return b;}
