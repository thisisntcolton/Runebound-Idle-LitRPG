// Fictional US-style annual salary bands; qualifications are game abstractions.
const rows=`IT support|computing|18000|65000|Technical support|Help desk trainee,Support technician,Senior support,Support lead
Systems administration|computing|48000|125000|Systems administration|Junior administrator,Administrator,Senior administrator,Principal administrator
Networking|computing|45000|140000|Networking|Network associate,Network engineer,Senior engineer,Network architect
Cybersecurity|computing|50000|155000|Security|SOC associate,Security analyst,Senior analyst,Security lead
Software|computing|55000|180000|Programming|Junior developer,Developer,Senior developer,Principal developer
Web|computing|35000|125000|Web development|Junior web developer,Web developer,Senior developer,Web lead
Database|computing|50000|145000|Databases|Database associate,Administrator,Senior DBA,Database architect
Cloud|computing|55000|170000|Cloud computing|Cloud associate,Cloud engineer,Senior engineer,Cloud architect
IT management|business|85000|180000|Leadership|IT manager,Senior manager,IT director,Senior director
Technology leadership|business|120000|300000|Technology strategy|VP technology,CTO,Group CTO,Executive chair
Nursing assistance|certificate|28000|48000|Patient care|Care aide,Nursing assistant,Senior aide,Team lead
Nursing|health|58000|120000|Nursing|Staff nurse,Registered nurse,Charge nurse,Nurse manager
Emergency medicine|certificate|35000|80000|Emergency care|EMT,Paramedic,Senior paramedic,Field supervisor
Medicine|medicine|65000|260000|Clinical medicine|Resident,Physician,Senior physician,Medical director
Surgery|medicine|70000|450000|Surgery|Surgical resident,Surgeon,Senior surgeon,Chief surgeon
Dentistry|dentistry|85000|250000|Dentistry|Associate dentist,Dentist,Senior dentist,Clinical director
Pharmacy|pharmacy|85000|160000|Pharmacy|Staff pharmacist,Pharmacist,Senior pharmacist,Pharmacy director
Psychology|doctorate|55000|145000|Psychology|Clinical trainee,Psychologist,Senior psychologist,Clinical lead
Physical therapy|doctorate|65000|130000|Rehabilitation|Junior therapist,Therapist,Senior therapist,Clinic lead
Veterinary|veterinary|65000|180000|Animal medicine|Associate vet,Veterinarian,Senior vet,Chief vet
Electrical|trade|32000|105000|Electrical work|Apprentice electrician,Electrician,Master electrician,Electrical supervisor
Plumbing|trade|32000|100000|Plumbing|Apprentice plumber,Plumber,Master plumber,Plumbing supervisor
Carpentry|trade|30000|85000|Carpentry|Apprentice carpenter,Carpenter,Master carpenter,Foreman
Welding|trade|32000|95000|Welding|Junior welder,Welder,Specialist welder,Welding supervisor
Automotive|trade|30000|90000|Mechanics|Service apprentice,Mechanic,Master technician,Shop foreman
HVAC|trade|32000|100000|HVAC|HVAC apprentice,Technician,Senior technician,Service manager
Equipment|certificate|34000|85000|Equipment operation|Trainee operator,Operator,Senior operator,Site supervisor
Construction|highschool|28000|80000|Construction|Laborer,Skilled worker,Crew lead,Site foreman
Machining|trade|32000|95000|Machining|Machine trainee,Machinist,Precision machinist,Shop supervisor
Industrial|trade|38000|110000|Industrial maintenance|Maintenance trainee,Technician,Senior technician,Maintenance lead
Policing|academy|42000|110000|Public safety|Probationary officer,Officer,Sergeant,Lieutenant
Investigation|academy|55000|125000|Investigation|Junior investigator,Detective,Senior detective,Chief investigator
Fire service|academy|38000|100000|Fire safety|Recruit,Firefighter,Lieutenant,Fire captain
Military enlisted|highschool|24000|85000|Military service|Recruit,Specialist,Sergeant,Senior enlisted
Military officer|degree|45000|150000|Command|Lieutenant,Captain,Major,Colonel
Corrections|academy|35000|85000|Corrections|Trainee officer,Officer,Sergeant,Warden
Social work|degree|38000|85000|Social work|Case assistant,Social worker,Senior worker,Program director
Postal|highschool|32000|75000|Logistics|Postal assistant,Carrier,Senior carrier,Postmaster
Dispatch|certificate|32000|75000|Dispatch|Trainee dispatcher,Dispatcher,Senior dispatcher,Shift lead
Parks|degree|32000|80000|Conservation|Ranger assistant,Ranger,Senior ranger,Park superintendent
Accounting|business|42000|125000|Accounting|Junior accountant,Accountant,Senior accountant,Controller
Analysis|business|45000|150000|Financial analysis|Junior analyst,Analyst,Senior analyst,Research director
Banking|highschool|28000|65000|Banking|Teller trainee,Teller,Senior teller,Branch supervisor
Planning|business|40000|140000|Financial planning|Planning associate,Planner,Senior planner,Practice lead
Insurance|certificate|32000|110000|Insurance|Agent trainee,Agent,Senior agent,Agency lead
HR|business|38000|120000|Human resources|HR assistant,Specialist,HR manager,HR director
Marketing|business|35000|140000|Marketing|Marketing assistant,Specialist,Manager,Director
Sales|highschool|28000|130000|Negotiation|Sales associate,Representative,Account executive,Sales director
Operations|business|48000|160000|Operations|Coordinator,Manager,Senior manager,Operations director
Executive|business|95000|350000|Executive leadership|Division manager,VP,Executive,CEO
Preschool|certificate|24000|55000|Early education|Classroom aide,Teacher,Lead teacher,Center director
Elementary|teaching|38000|85000|Teaching|Junior teacher,Teacher,Lead teacher,Department lead
Secondary|teaching|40000|95000|Teaching|Junior teacher,Teacher,Senior teacher,Department chair
Professor|doctorate|50000|150000|Academic teaching|Lecturer,Assistant professor,Associate professor,Professor
Research|doctorate|50000|155000|Research|Research fellow,Scientist,Senior scientist,Research director
Chemistry|science|42000|120000|Chemistry|Lab associate,Chemist,Senior chemist,Lab director
Biology|science|40000|115000|Biology|Research assistant,Biologist,Senior biologist,Research lead
Environment|science|40000|110000|Environmental science|Field associate,Scientist,Senior scientist,Program lead
School leadership|teaching|65000|140000|School leadership|Assistant principal,Principal,Senior principal,Superintendent
Library|degree|32000|85000|Library science|Library assistant,Librarian,Senior librarian,Library director
Retail|none|18000|38000|Customer service|Cashier trainee,Cashier,Senior cashier,Shift lead
Retail management|highschool|32000|85000|Retail operations|Shift supervisor,Assistant manager,Store manager,District manager
Waiting|none|18000|55000|Hospitality|Server assistant,Server,Senior server,Floor lead
Bar|highschool|24000|65000|Hospitality|Bar assistant,Bartender,Senior bartender,Bar manager
Cooking|certificate|28000|100000|Cooking|Prep cook,Line cook,Sous chef,Executive chef
Hotel|business|38000|125000|Hospitality management|Front desk lead,Assistant manager,Hotel manager,Regional manager
Delivery|highschool|25000|55000|Logistics|Courier trainee,Courier,Senior courier,Dispatch lead
Trucking|certificate|38000|95000|Commercial driving|Junior driver,Driver,Senior driver,Fleet lead
Cabin service|certificate|32000|85000|Cabin service|Junior attendant,Attendant,Senior attendant,Purser
Customer support|highschool|26000|70000|Customer service|Support associate,Representative,Senior representative,Team lead
Law|law|60000|230000|Law|Associate attorney,Attorney,Senior attorney,Partner
Judiciary|law|95000|210000|Judicial practice|Magistrate,Judge,Senior judge,Chief judge
Architecture|engineering|48000|150000|Architecture|Design associate,Architect,Senior architect,Principal architect
Civil engineering|engineering|52000|150000|Civil engineering|Junior engineer,Engineer,Senior engineer,Principal engineer
Mechanical engineering|engineering|55000|155000|Mechanical engineering|Junior engineer,Engineer,Senior engineer,Principal engineer
Aviation|pilot|45000|250000|Aviation|First officer,Senior first officer,Captain,Chief pilot
Journalism|degree|30000|100000|Writing|Junior reporter,Reporter,Senior reporter,Editor
Real estate|certificate|25000|140000|Real estate|Junior agent,Agent,Senior agent,Broker
Private investigation|certificate|32000|95000|Investigation|Investigation assistant,Investigator,Senior investigator,Agency lead
Planning|degree|42000|115000|Urban planning|Planning assistant,Planner,Senior planner,Planning director`;
export const CAREERS=Object.fromEntries(rows.split('\n').map((r,i)=>{const [field,credential,min,max,skill,titles]=r.split('|');return [i+1,{field,credential,min:+min,max:+max,skill,titles:titles.split(','),experience:({9:6,10:10,32:4,50:8,59:5,72:8})[i+1]||0}]}));
export const EXTRA_COURSES=[['certificate','Professional certificate',1,2500],['academy','Public safety academy',2,5000],['degree','General university degree',4,10000],['science','Science degree',4,12000],['teaching','Teaching degree',4,10000],['engineering','Engineering degree',4,14000],['medicine','Medical qualification',8,22000],['dentistry','Dental qualification',8,22000],['pharmacy','Pharmacy qualification',6,18000],['doctorate','Doctoral qualification',8,15000],['veterinary','Veterinary qualification',8,20000],['law','Law qualification',7,18000],['pilot','Commercial flight training',3,20000]];
const hobbies=`Reading|Research|Read a book,Discuss a book,Visit library,Write a review
Creative writing|Writing|Draft a story,Edit prose,Attend workshop,Submit story
Chess|Gaming|Solve tactics,Play a match,Study openings,Enter tournament
Board gaming|Gaming|Learn rules,Host game night,Study strategy,Enter tournament
Tabletop roleplaying|Writing|Create character,Run campaign,Write adventure,Join group
Puzzle solving|Research|Solve puzzle,Study patterns,Join puzzle club,Enter contest
Model building|Mechanics|Assemble model,Paint details,Study plans,Exhibit model
Miniature painting|Art|Paint miniature,Practice shading,Join painting group,Enter exhibition
Origami|Art|Fold designs,Study patterns,Teach folding,Exhibit work
Calligraphy|Art|Practice lettering,Study scripts,Make cards,Exhibit lettering
Trading cards|Gaming|Build deck,Trade cards,Visit card shop,Enter tournament
Coins|Finance|Catalog coins,Research mint history,Visit coin club,Attend show
Stamps|Research|Catalog stamps,Research postal history,Trade stamps,Attend show
Watches|Mechanics|Study movements,Catalog watches,Visit watch club,Attend exhibition
Comics|Art|Read comics,Catalog collection,Join comic club,Attend convention
Antiques|Research|Research provenance,Catalog antiques,Visit antique fair,Exhibit collection
Books|Research|Catalog books,Research editions,Visit bookshop,Attend book fair
Vinyl|Music|Listen to records,Catalog albums,Visit record shop,Attend record fair
Art collecting|Art|Study artists,Catalog art,Visit gallery,Attend exhibition
Classic cars|Mechanics|Study classic cars,Maintain collection,Join car club,Attend show
Fishing|Outdoors|Fish at lake,Study fish,Maintain tackle,Enter fishing contest
Camping|Outdoors|Pitch camp,Plan campsite,Maintain gear,Camp with friends
Hiking|Outdoors|Walk trail,Study maps,Train endurance,Join group hike
Backpacking|Outdoors|Plan trek,Pack gear,Train stamina,Take trek
Birdwatching|Outdoors|Observe birds,Record sightings,Study species,Join bird walk
Gardening|Gardening|Plant crops,Tend garden,Study horticulture,Sell produce
Foraging|Outdoors|Join guided walk,Study plant identification,Record observations,Attend workshop
Climbing|Athletics|Practice climbing,Train grip,Take safety class,Join climbing event
Kayaking|Athletics|Paddle,Practice safety,Maintain kayak,Join group paddle
Nature photography|Photography|Photograph wildlife,Edit images,Study composition,Exhibit photos
Woodworking|Carpentry|Build project,Practice joinery,Study plans,Sell craft
Metalworking|Mechanics|Shape metal,Practice finishing,Study materials,Exhibit craft
Home improvement|Carpentry|Repair room,Plan renovation,Learn techniques,Complete project
Vehicle restoration|Mechanics|Restore component,Study manuals,Maintain vehicle,Attend show
Electronics|Electronics|Build circuit,Study components,Repair device,Exhibit project
Robotics|Programming|Build robot,Program controls,Test prototype,Enter contest
3D printing|Mechanics|Design model,Print prototype,Calibrate printer,Exhibit project
Leatherworking|Art|Cut pattern,Stitch leather,Practice finishing,Sell craft
Sewing|Art|Sew garment,Study patterns,Repair clothing,Exhibit garment
Furniture restoration|Carpentry|Repair furniture,Refinish wood,Study styles,Sell furniture
Cooking|Cooking|Cook meal,Study recipes,Host dinner,Enter cookoff
Baking|Cooking|Bake bread,Practice pastry,Study recipes,Sell baked goods
Barbecue|Cooking|Cook outdoors,Study techniques,Host cookout,Enter cookoff
Coffee|Cooking|Brew coffee,Study beans,Practice tasting,Host tasting
Tea|Cooking|Brew tea,Study varieties,Catalog tea,Host tasting
Cake decorating|Art|Decorate cake,Practice piping,Study designs,Sell cake
Food preservation|Cooking|Preserve produce,Study food safety,Organize pantry,Attend workshop
Homesteading|Gardening|Tend homestead,Plan harvest,Repair equipment,Sell surplus
Beekeeping|Gardening|Attend apiary lesson,Inspect hive with mentor,Study pollinators,Sell honey
Indoor plants|Gardening|Repot plants,Study light needs,Propagate plants,Trade plants
Astronomy|Research|Observe sky,Study stars,Record observations,Join astronomy club
History|Research|Read history,Visit museum,Research archive,Present findings
Genealogy|Research|Research records,Interview relatives,Build family tree,Share findings
Philosophy|Research|Read philosophy,Write reflection,Discuss ideas,Attend seminar
Languages|Languages|Practice vocabulary,Study grammar,Conversation practice,Take proficiency test
Archaeology|Research|Visit museum,Study artifacts,Join supervised dig,Present findings
Mathematics|Research|Solve problems,Study theory,Join math club,Enter contest
Science|Research|Run safe experiment,Study theory,Record results,Present project
Worldbuilding|Writing|Design setting,Develop characters,Write lore,Share world
Radio|Electronics|Study radio,Practice licensed operation,Maintain equipment,Join radio club`;
export const HOBBIES=Object.fromEntries(hobbies.split('\n').map((r,i)=>{const [name,skill,actions]=r.split('|');return [161+i,{skill,actions:actions.split(','),cost: i>=10&&i<20?150:i>=20&&i<40?100:25}]}));
