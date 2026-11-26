const c=(text,next,time=1)=>({text,next,time});
const k=(text,skill,good,poor,bad)=>({text,skill,outcomes:[{min:16,next:good,time:0},{min:9,next:poor,time:1},{min:-99,next:bad,time:2}]});
const b=(text,foes,next)=>({text,foes,next,time:1});
const s=(title,body,choices)=>({title,body,choices});
const e=(title,body,ending)=>({title,body,ending,choices:[]});
export const scenes={
 start:s('The silent bell','The flood bell at Ashmere has fallen silent. A courier carrying the sluice key vanished before the storm. If the gates remain shut at midnight, the lower town will drown. Your party reaches a fork beneath a sky bruised with rain.',[k('Read the tracks','survival','tracks','tracks','ravine'),c('Question the ferryman','ferry')]),
 tracks:s('Wheel ruts','A narrow cart has cut deep grooves toward the old quarry. A strip of blue cloth hangs from a thorn.',[c('Follow the cart','quarry'),k('Survey the ridge','perception','ridge','ridge','wolves')]),
 ferry:s('The ferryman','A lantern swings over the empty ferry. The boatman saw armed strangers escorting a prisoner.',[k('Ask for a shortcut','persuasion','tunnel','ridge','road'),c('Take the main road','road')]),
 ravine:s('The washed-out path','The trail collapses into a ravine. Water churns below the broken bridge.',[k('Cross on the fallen trunk','athletics','ridge','ridge','wolves'),c('Climb back to the road','road')]),
 wolves:s('Hungry eyes','Two wolves emerge from the rain, driven from their dens by the rising water.',[b('Defend the party',['wolf','wolf'],'ridge'),c('Withdraw to the road','road')]),
 road:s('The toll road','A makeshift barricade blocks the road. A nervous scout watches from behind it.',[k('Talk past the scout','persuasion','camp','camp','ambush'),b('Break through',['scout','archer'],'camp')]),
 ambush:s('The alarm','A whistle cuts through the rain. Reinforcements rush from the trees.',[b('Stand your ground',['scout','archer'],'camp')]),
 ridge:s('Above the quarry','From the ridge you see a lantern-lit camp and an abandoned drainage tunnel.',[c('Descend to the camp','camp'),c('Enter the tunnel','tunnel')]),
 quarry:s('The quarry','Fresh bootprints lead toward a camp. An old hoist hangs above a narrow shaft.',[c('Approach the camp','camp'),k('Descend the shaft','athletics','tunnel','tunnel','hound')]),
 hound:s('The kennel','A chained hound breaks loose as your party lands in the mud.',[b('Drive it off',['hound'],'tunnel')]),
 camp:s('The smugglers’ camp','The camp is nearly deserted. A ledger lies beside a cold fire, and a guard patrols the supply tent.',[k('Search the ledger unseen','stealth','ledger','ledger','patrol'),c('Approach the guard','guard')]),
 patrol:s('Spotted','The guard raises a lantern and calls for help.',[b('Fight the patrol',['guard','scout'],'ledger')]),
 guard:s('A reluctant guard','The guard admits that the courier was taken to the old sluice tower. He seems frightened of his employer.',[k('Convince him to help','persuasion','ledger','tower','patrol'),c('Leave him behind','tower')]),
 ledger:s('The hidden bargain','The ledger reveals that the tower warden intends to sell the key after the flood. You copy the evidence.',[{...c('Keep the evidence and proceed','tower'),flag:'evidence'},c('Take the drainage route','tunnel')]),
 tunnel:s('Beneath the hill','Water drips from carved stone. Strange blue light spills from a cracked archway.',[k('Read the ward','arcana','shrine','shrine','shade'),c('Follow the water','grate')]),
 shade:s('The drowned shade','A pale figure rises from the flooded floor, its voice lost beneath the current.',[b('Dispel the shade',['shade'],'grate')]),
 shrine:s('The old shrine','A dry alcove offers a brief refuge. The stone is warm despite the storm.',[{...c('Rest and bind wounds','grate'),heal:25},c('Press onward','grate',0)]),
 grate:s('The iron grate','A rusted lock seals the passage into the tower cellar.',[k('Pick the lock','lockpicking','cellar','cellar','cult'),c('Take the surface stairs','tower')]),
 cult:s('The flooded chapel','A cultist steps from behind a pillar and raises a crooked staff.',[b('Defeat the cultist',['cultist'],'cellar')]),
 tower:s('The sluice tower','The tower stands over a roaring spillway. A pair of sentries guard the entrance.',[k('Slip through a service door','stealth','cellar','hall','sentries'),b('Challenge the sentries',['guard','archer'],'hall')]),
 sentries:s('The sentries','The sentries bar the doorway and draw their blades.',[b('Fight',['guard','archer'],'hall')]),
 cellar:s('The prisoner','The courier is bound beside a pile of broken tools. He whispers that the warden has the key.',[{...c('Free the courier','hall',0),flag:'rescued'},c('Rush upstairs','hall',0)]),
 hall:s('The winding stair','The tower groans. Above, a heavy mechanism rattles against its housing.',[c('Confront the warden','boss',0),k('Inspect the mechanism','investigation','mechanism','mechanism','boss')]),
 mechanism:s('The emergency lever','A concealed lever can open a secondary channel, buying the town some relief.',[{...c('Pull the lever','boss',0),flag:'lever'},c('Leave it untouched','boss',0)]),
 boss:s('The warden','The warden holds the brass key above the roaring spillway. He demands payment for the town’s survival.',[b('Seize the key',['warden','guard'],'gate'),{...k('Expose his bargain','persuasion','gate','gate','duel'),requires:'evidence'}]),
 duel:s('The last stand','The warden throws aside his cloak and draws a blade.',[b('Defeat the warden',['warden'],'gate')]),
 gate:s('The rising water','The key turns. The gate mechanism shudders, ready to release the floodwater.',[c('Open the gates','saved',0),c('Return for the courier','return',1)]),
 return:s('One last rescue','You find the courier and guide him through the tower as the water rises.',[{...c('Open the gates','saved',0),flag:'rescued'}]),
 saved:e('The bells ring again','Water pours through the open channels. Ashmere survives the storm.','success'),
 late:e('Midnight flood','The lower streets disappear beneath the water. Your guild returns with a bitter lesson.','late'),
 defeat:e('A costly retreat','Your surviving rescuers carry the fallen back to the guild. The contract remains unfulfilled.','defeat'),
 retreat:e('Contract abandoned','Your party returns before the storm closes the roads.','retreat')
};
