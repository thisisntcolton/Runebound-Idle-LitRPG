// Private adaptation of Little Branch by Peter Carlson (2025). Condensed party rules.
const c=(text,next,time=0)=>({text,next,time});
const k=(text,skill,rows)=>({text,skill,outcomes:rows.map(([min,next,time])=>({min,next,time}))});
const b=(text,foes,next)=>({...c(text,next),foes});
const s=(title,body,choices)=>({title,body,choices});
const travel=(next,text,skill='survival')=>k(text,skill,[[20,next,1],[10,next,2],[-99,next,3]]);
const routes=[travel('lb8','Search the kobold caves'),travel('lb9','Find the Green Lady'),k('Return to Little Branch','athletics',[[10,'lb3',1],[-99,'lb3',2]])];
const glade=k('Find Cinnamae’s glade','survival',[[10,'lb13',1],[-99,'lb13',2]]);
const final=[k('Tell Cinnamae a compelling story','persuasion',[[20,'lb61',0],[-99,'lb62',0]]),k('Resist her magic and confront her','arcana',[[14,'lb63',0],[-99,'lb64',1]])];
export const littleBranch={
 lb1:s('Daiza is missing','A child from Little Branch has vanished while gathering mushrooms. The villagers ask your guild to find her before dawn. It is six in the evening, and rain is coming.',[k('Search deeper into the forest','investigation',[[16,'lb2',0],[8,'lb2',1],[-99,'lb2',2]]),k('Return to the village for help','athletics',[[10,'lb3',1],[-99,'lb3',2]])]),
 lb2:s('The mushroom trail','Fresh king’s cap mushrooms mark a trail toward a fire where two goblins quarrel over food.',[k('Approach unseen','stealth',[[9,'lb4',0],[-99,'lb5',0]]),k('Avoid the goblins','survival',[[20,'lb13',1],[10,'lb7',1],[-99,'lb7',2]])]),
 lb3:s('Little Branch','The village organizes a search. Geirhild the scout and Unnulf the acolyte offer advice and supplies.',routes.slice(0,2)),
 lb4:s('Coldnose and Oluk','The goblins have not noticed your party.',[k('Appeal to the goblins','persuasion',[[16,'lb12',0],[-99,'lb5',0]]),b('Attack the goblins',['scout','scout'],'lb11')]),
 lb5:s('Alert goblins','The goblins are wary and ready to fight.',[k('Try diplomacy','persuasion',[[16,'lb12',0],[-99,'lb11',1]]),b('Fight',['scout','scout'],'lb11')]),
 lb7:s('Lost trail','The mushroom trail disappears in the rain.',routes),
 lb11:s('No answers','The goblins offer no further help.',routes),
 lb12:s('A fragile truce','Coldnose and Oluk suggest the Green Lady or the kobolds may know more.',routes),
 lb8:s('Kobold caves','Bones and skins surround the cave entrance.',[k('Enter cautiously','perception',[[15,'lb16',0],[-99,'lb16',1]]),k('Find another entrance','survival',[[15,'lb23',1],[-99,'lb23',2]])]),
 lb16:s('A pit trap','The cave floor gives way beneath your party.',[k('Escape the trap','athletics',[[18,'lb23',0],[-99,'lb23',1]])]),
 lb23:s('The ritual cavern','Kobolds gather around a bound satyr, Fendle Curlyhorn. A passage leads toward another prisoner.',[b('Free Fendle',['guard','scout','scout'],'lb29'),k('Slip into the passage','stealth',[[5,'lb28',0],[-99,'lb29',1]])]),
 lb28:s('Sylren','A wounded wood elf is trapped beneath an iron grate.',[k('Pick the lock','lockpicking',[[15,'lb35',0],[-99,'lb32',1]]),k('Break the grate','athletics',[[15,'lb35',0],[-99,'lb32',1]])]),
 lb32:s('The ooze','An ooze threatens Sylren as the grate resists your efforts.',[b('Protect Sylren',['shade'],'lb35'),c('Leave the caves','lb37',1)]),
 lb29:s('Fendle freed','The satyr is free, but Daiza is not here.',[c('Search for Sylren','lb28'),...routes]),
 lb35:s('Escape the caves','The rescued prisoner helps direct you toward the black alder glade.',[glade,...routes]),
 lb37:s('Leaving the caves','Your search here has failed.',routes),
 lb9:s('The black marsh','Mud and poisonous vapors surround the path to the Green Lady.',[k('Cross the marsh','survival',[[13,'lb44',0],[-99,'lb44',1]])]),
 lb44:s('The witch’s guardian','A dire wolf blocks the approach to the hut.',[b('Face the guardian',['hound'],'lb46')]),
 lb46:s('The Green Lady','The witch offers knowledge in exchange for a bargain. She knows who took Daiza.',[ {...c('Accept the bargain','lb47'),flag:'bargain'},c('Refuse the bargain','lb48')]),
 lb47:s('A costly promise','You sign the Green Lady’s book. She directs you toward Cinnamae.',[glade,...routes]),
 lb48:s('The dryad','The Green Lady reveals that Cinnamae, a dryad, took Daiza.',[glade,...routes]),
 lb13:s('Black alder glade','A carved wooden bird lies in the mud. Laughter and a child’s cries echo among the trees.',[k('Follow the laughter','perception',[[13,'lb14',0],[-99,'lb14',1]]),k('Follow the cries','perception',[[13,'lb19',0],[-99,'lb19',1]])]),
 lb14:s('Cinnamae','A fey woman stands in the moonlight. Her charm is dangerous.',final),
 lb19:s('The living prison','Daiza is being transformed into a black alder tree. Twig blights defend it.',[b('Break the wooden prison',['shade','shade'],'lb52'),c('Confront Cinnamae','lb14')]),
 lb52:s('Fey enchantment','Cinnamae attempts to stop your assault with magic.',[k('Resist the charm','arcana',[[14,'lb54',0],[-99,'lb64',1]])]),
 lb54:s('Break the spell','Your party resists the dryad’s influence.',[b('Finish freeing Daiza',['shade'],'lb67'),...final]),
 lb61:s('A story that reaches the fey','Your tale persuades Cinnamae to release Daiza.',[c('Bring Daiza home','lb67')]),
 lb62:s('An unimpressed dryad','Cinnamae loses interest in your tale.',[k('Try another story','persuasion',[[20,'lb61',1],[-99,'lb62',1]]),c('Find Daiza’s tree','lb19')]),
 lb63:s('Defy Cinnamae','Your party withstands the dryad’s magic.',[b('Confront the dryad',['warden'],'lb67')]),
 lb64:s('Lost time','The charm overwhelms your party for a time.',[k('Gather your resolve','arcana',[[14,'lb63',0],[-99,'lb19',1]])]),
 lb67:{...s('Daiza is saved','Daiza returns safely to Little Branch. The village celebrates your party’s rescue.',[]),ending:'success'},
 lb53:{...s('Dawn','The ritual is complete. Your party has run out of time.',[]),ending:'failure'}
};
