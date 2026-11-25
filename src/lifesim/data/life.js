export const JOBS = [
 ['retail','Retail Associate',28000,0,''], ['office','Office Assistant',36000,40,'highschool'], ['electrician','Electrician',62000,40,'trade'], ['developer','Software Developer',78000,65,'computing'], ['nurse','Nurse',72000,60,'health'], ['accountant','Accountant',65000,55,'business']
].map(([id,name,salary,smarts,credential])=>({id,name,salary,smarts,credential}));
export const COURSES = [ ['trade','Trade School',2,6000], ['computing','University — Computing',4,12000], ['health','University — Nursing',4,12000], ['business','University — Business',4,10000] ];
export const HOMES = [['family','Family housing',0,0],['rent','Apartment',0,9600],['starter','Starter home',150000,2400],['large','Family home',280000,4200],['estate','Estate',650000,10000],['mansion','Mansion',2400000,42000]];
export const CONDITIONS = {stress:['Chronic Stress',4,250],flu:['Flu',3,100],bone:['Broken Bone',5,800],pressure:['Hypertension',3,350]};
