export const crops=[
{id:'potato',name:'Potatoes',level:1,food:1,water:2,ms:300000,xp:25,color:0xc6a66a},
{id:'carrot',name:'Carrots',level:5,food:2,water:3,ms:480000,xp:35,color:0xe28a37},
{id:'turnip',name:'Turnips',level:10,food:3,water:4,ms:720000,xp:50,color:0xd4b4ce},
{id:'wheat',name:'Wheat',level:15,food:5,water:5,ms:1200000,xp:75,color:0xe3c05d},
{id:'cabbage',name:'Cabbage',level:20,food:8,water:6,ms:1800000,xp:100,color:0x98c66c},
{id:'pumpkin',name:'Blackroot Pumpkin',level:35,food:15,water:10,ms:3600000,xp:180,color:0xd67a29},
] as const;
export const cropFor=(id?:string)=>crops.find(c=>c.id===id)??crops[0];
