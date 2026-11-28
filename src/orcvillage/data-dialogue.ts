import {DialogueDefinition} from './systems/Dialogue';
const intro=(id:string,npc:string,text:string,answer:string):DialogueDefinition=>({id:`${id}.intro`,npc,priority:10,once:true,entry:'greeting',nodes:[{id:'greeting',speaker:'npc',text,responses:[{id:'reply',text:answer,next:'reply'}]},{id:'reply',speaker:'gruk',text:answer,responses:[{id:'finish',text:'Continue'},...(['1','3','18','8'].includes(npc)?[{id:'trade',text:'Trade',action:'merchant' as const}]:[])]}]});
export const dialogues:DialogueDefinition[]=[
 intro('urga','urga','The fire is lit. We can build from here, Gruk.','One beam at a time. We will make it home.'),
 intro('barnaby','1','Bread travels farther when someone is willing to share it. Welcome to Riverhaven.','Then I will remember to bring enough for two.'),
 intro('garrick','3','A good edge takes patience. What brings you to my forge?','A village to rebuild, and tools that need to last.'),
 intro('agatha','18','Mind the fish crates. The river has been generous today.','Good. A full river makes for a less hungry village.'),
 intro('grognar','68','An orc among the flowerbeds? You are welcome here, cousin.','Good to meet another builder. Your flowers look well defended.'),
 intro('greta','8','Welcome. Keep your axe off my tables and we will get along.','Fair enough. The tables have done me no harm.'),
 intro('reed','70','Keep your shadow off the water. Old Whiskers is somewhere beneath it.','I will stand back. He sounds particular about visitors.')
];

