// Curated offline question bank — used when AI generation is unavailable.
export interface BankQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  points: number;
  image_url?: string;
}

type Q = [string, string[], number, string];

const BANK: Record<string, Q[]> = {
  science: [
    ["What is the chemical symbol for gold?", ["Ag", "Au", "Gd", "Go"], 1, "Au comes from the Latin 'aurum', meaning gold."],
    ["What gas do plants absorb during photosynthesis?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 2, "Plants take in CO₂ and release O₂ during photosynthesis."],
    ["What is the speed of light in vacuum (approx.)?", ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "1.5 × 10⁸ m/s", "3 × 10¹⁰ m/s"], 0, "Light travels at about 299,792 km/s, roughly 3 × 10⁸ m/s."],
    ["What is the SI unit of force?", ["Joule", "Watt", "Newton", "Pascal"], 2, "The newton (N) equals 1 kg·m/s²."],
    ["Which particle has a negative charge?", ["Proton", "Neutron", "Electron", "Positron"], 2, "Electrons carry a charge of −1."],
    ["What is the pH of pure water at 25°C?", ["5", "7", "9", "14"], 1, "Pure water is neutral with pH 7."],
    ["Which is the most abundant gas in Earth's atmosphere?", ["Oxygen", "Nitrogen", "Argon", "CO₂"], 1, "Nitrogen makes up about 78% of the atmosphere."],
    ["Who proposed the theory of general relativity?", ["Newton", "Bohr", "Einstein", "Faraday"], 2, "Albert Einstein published general relativity in 1915."],
    ["What is H₂O commonly known as?", ["Salt", "Water", "Hydrogen peroxide", "Ammonia"], 1, "H₂O is two hydrogen atoms bonded to one oxygen atom."],
    ["Which element has atomic number 6?", ["Oxygen", "Nitrogen", "Carbon", "Boron"], 2, "Carbon has 6 protons."],
  ],
  biology: [
    ["Which organelle is the powerhouse of the cell?", ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], 2, "Mitochondria produce ATP via cellular respiration."],
    ["How many chambers does the human heart have?", ["2", "3", "4", "5"], 2, "Two atria and two ventricles."],
    ["Which blood cells fight infection?", ["Red blood cells", "White blood cells", "Platelets", "Plasma"], 1, "Leukocytes (WBCs) are part of the immune system."],
    ["Insulin is secreted by which cells?", ["Alpha cells", "Beta cells of pancreas", "Hepatocytes", "Kupffer cells"], 1, "Beta cells in the islets of Langerhans secrete insulin."],
    ["The largest organ of the human body is?", ["Liver", "Brain", "Skin", "Lungs"], 2, "Skin is the largest organ by surface area and weight."],
    ["Which vitamin deficiency causes scurvy?", ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], 2, "Vitamin C is needed for collagen synthesis."],
    ["The functional unit of the kidney is?", ["Neuron", "Nephron", "Alveolus", "Villus"], 1, "Each kidney has about a million nephrons that filter blood."],
    ["Which drug class does aspirin belong to?", ["Antibiotic", "NSAID", "Beta blocker", "Antiviral"], 1, "Aspirin is a non-steroidal anti-inflammatory drug."],
    ["DNA replication is described as?", ["Conservative", "Semi-conservative", "Dispersive", "Random"], 1, "Each new DNA molecule keeps one original strand (Meselson–Stahl)."],
    ["Normal adult resting heart rate is?", ["30–50 bpm", "60–100 bpm", "110–140 bpm", "150–180 bpm"], 1, "60–100 beats per minute is the normal adult range."],
  ],
  history: [
    ["In which year did World War II end?", ["1943", "1944", "1945", "1946"], 2, "WWII ended in 1945 with Germany's and Japan's surrender."],
    ["Who was the first President of the United States?", ["Lincoln", "Jefferson", "Washington", "Adams"], 2, "George Washington served from 1789 to 1797."],
    ["The Great Wall was mainly built to protect which country?", ["Japan", "India", "China", "Mongolia"], 2, "It protected Chinese states from northern invasions."],
    ["In which year did India gain independence?", ["1945", "1947", "1950", "1952"], 1, "India became independent on 15 August 1947."],
    ["Who was known as the 'Maid of Orléans'?", ["Marie Curie", "Joan of Arc", "Catherine the Great", "Queen Victoria"], 1, "Joan of Arc led French forces at Orléans in 1429."],
    ["The French Revolution began in?", ["1776", "1789", "1799", "1815"], 1, "It started in 1789 with the storming of the Bastille."],
    ["Which empire built Machu Picchu?", ["Aztec", "Maya", "Inca", "Olmec"], 2, "The Inca built it in the 15th century."],
    ["Who wrote the Indian Constitution's draft committee chair?", ["Nehru", "Gandhi", "B. R. Ambedkar", "Patel"], 2, "Dr. B. R. Ambedkar chaired the Drafting Committee."],
    ["The Berlin Wall fell in?", ["1985", "1989", "1991", "1993"], 1, "It fell on 9 November 1989."],
    ["Which ancient civilization built the pyramids of Giza?", ["Romans", "Greeks", "Egyptians", "Persians"], 2, "Ancient Egyptians built them around 2500 BCE."],
  ],
  geography: [
    ["What is the capital of Australia?", ["Sydney", "Melbourne", "Canberra", "Perth"], 2, "Canberra was chosen as a compromise between Sydney and Melbourne."],
    ["Which is the longest river in the world?", ["Amazon", "Nile", "Yangtze", "Mississippi"], 1, "The Nile is about 6,650 km long (though the Amazon is close)."],
    ["Which is the largest ocean?", ["Atlantic", "Indian", "Arctic", "Pacific"], 3, "The Pacific covers about a third of Earth's surface."],
    ["Mount Everest lies on the border of Nepal and?", ["India", "China", "Bhutan", "Pakistan"], 1, "It sits on the Nepal–China (Tibet) border."],
    ["Which country has the most population (2024)?", ["China", "India", "USA", "Indonesia"], 1, "India overtook China in 2023."],
    ["What is the capital of Canada?", ["Toronto", "Vancouver", "Ottawa", "Montreal"], 2, "Ottawa is the federal capital."],
    ["The Sahara desert is located in?", ["Asia", "Africa", "Australia", "South America"], 1, "It spans much of North Africa."],
    ["Which is the smallest country in the world?", ["Monaco", "Vatican City", "San Marino", "Malta"], 1, "Vatican City is about 0.44 km²."],
    ["How many continents are there?", ["5", "6", "7", "8"], 2, "Africa, Antarctica, Asia, Australia, Europe, North and South America."],
    ["The Amazon rainforest is mostly in?", ["Peru", "Colombia", "Brazil", "Venezuela"], 2, "About 60% lies within Brazil."],
  ],
  technology: [
    ["What does CPU stand for?", ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"], 0, "The CPU executes program instructions."],
    ["Who co-founded Apple with Steve Jobs?", ["Bill Gates", "Steve Wozniak", "Elon Musk", "Larry Page"], 1, "Steve Wozniak co-founded Apple in 1976."],
    ["What does 'HTTP' stand for?", ["HyperText Transfer Protocol", "High Transfer Text Process", "Hyperlink Text Tool Protocol", "Host Transfer Type Protocol"], 0, "HTTP is the foundation of data transfer on the web."],
    ["1 byte equals how many bits?", ["4", "8", "16", "32"], 1, "A byte is 8 bits."],
    ["Which company developed Android?", ["Apple", "Microsoft", "Google", "Samsung"], 2, "Google acquired and develops Android."],
    ["RAM stands for?", ["Read Access Memory", "Random Access Memory", "Run All Memory", "Rapid Access Module"], 1, "RAM is volatile working memory."],
    ["What does 'AI' stand for?", ["Automated Internet", "Artificial Intelligence", "Advanced Interface", "Applied Information"], 1, "AI is machines performing tasks that need intelligence."],
    ["Which of these is an open-source OS?", ["Windows", "macOS", "Linux", "iOS"], 2, "Linux kernel is open source under GPL."],
  ],
  programming: [
    ["Which data structure uses LIFO?", ["Queue", "Stack", "Array", "Tree"], 1, "Stack: Last In, First Out."],
    ["What is the time complexity of binary search?", ["O(n)", "O(log n)", "O(n²)", "O(1)"], 1, "It halves the search space each step."],
    ["Which keyword declares a constant in JavaScript?", ["var", "let", "const", "static"], 2, "const creates a binding that can't be reassigned."],
    ["Python lists are?", ["Immutable", "Mutable", "Fixed size", "Typed"], 1, "Lists can be changed after creation; tuples cannot."],
    ["What does SQL stand for?", ["Structured Query Language", "Simple Query Logic", "Sequential Query List", "Standard Question Language"], 0, "SQL is used to manage relational databases."],
    ["Which sort has worst case O(n log n)?", ["Quick sort", "Bubble sort", "Merge sort", "Insertion sort"], 2, "Merge sort is always O(n log n)."],
    ["In OOP, hiding internal details is called?", ["Inheritance", "Polymorphism", "Encapsulation", "Abstraction only"], 2, "Encapsulation bundles data and restricts direct access."],
    ["Which symbol starts a single-line comment in Python?", ["//", "#", "/*", "--"], 1, "Python uses # for comments."],
    ["What does `typeof null` return in JavaScript?", ["'null'", "'object'", "'undefined'", "'number'"], 1, "A long-standing JS quirk: typeof null is 'object'."],
  ],
  engineering: [
    ["Ohm's law states V equals?", ["I/R", "I × R", "R/I", "I + R"], 1, "Voltage = current × resistance."],
    ["Which scheduling algorithm can cause starvation?", ["Round robin", "FCFS", "Priority scheduling", "FIFO"], 2, "Low-priority processes may wait indefinitely."],
    ["How many layers does the OSI model have?", ["4", "5", "7", "9"], 2, "Physical to Application: 7 layers."],
    ["Which gate outputs 1 only when all inputs are 1?", ["OR", "AND", "XOR", "NOR"], 1, "AND gate requires all inputs high."],
    ["The unit of electrical capacitance is?", ["Henry", "Farad", "Tesla", "Weber"], 1, "Capacitance is measured in farads."],
    ["TCP is a ___ protocol.", ["Connectionless", "Connection-oriented", "Broadcast", "Physical"], 1, "TCP establishes a connection with a handshake."],
    ["Young's modulus relates stress to?", ["Strain", "Force", "Area", "Density"], 0, "E = stress / strain."],
    ["Deadlock requires which condition?", ["Preemption", "Circular wait", "Unlimited resources", "Single process"], 1, "Circular wait is one of the four Coffman conditions."],
  ],
  mathematics: [
    ["What is the value of π to two decimals?", ["3.12", "3.14", "3.16", "3.18"], 1, "π ≈ 3.14159."],
    ["What is the derivative of x²?", ["x", "2x", "x²", "2"], 1, "d/dx xⁿ = n·xⁿ⁻¹."],
    ["What is 12 × 12?", ["124", "144", "132", "154"], 1, "12 × 12 = 144."],
    ["The sum of angles in a triangle is?", ["90°", "180°", "270°", "360°"], 1, "Interior angles of a triangle add to 180°."],
    ["What is √81?", ["7", "8", "9", "10"], 2, "9 × 9 = 81."],
    ["Which is a prime number?", ["21", "27", "29", "33"], 2, "29 has no divisors other than 1 and itself."],
    ["What is 15% of 200?", ["20", "25", "30", "35"], 2, "0.15 × 200 = 30."],
    ["∫ 1/x dx equals?", ["x", "ln|x| + C", "1/x² + C", "eˣ + C"], 1, "The antiderivative of 1/x is ln|x|."],
  ],
  sports: [
    ["How many players are on a football (soccer) team on the field?", ["9", "10", "11", "12"], 2, "Each side fields 11 players."],
    ["Which country has won the most FIFA World Cups?", ["Germany", "Argentina", "Brazil", "Italy"], 2, "Brazil has won 5 titles."],
    ["How many runs is a boundary six worth in cricket?", ["4", "5", "6", "8"], 2, "Clearing the rope on the full scores 6."],
    ["Who is known as the 'God of Cricket'?", ["Virat Kohli", "Sachin Tendulkar", "MS Dhoni", "Brian Lara"], 1, "Sachin Tendulkar holds many batting records."],
    ["The Olympics are held every how many years?", ["2", "3", "4", "5"], 2, "Summer and Winter Games each run every 4 years."],
    ["Which Grand Slam is played on clay?", ["Wimbledon", "US Open", "French Open", "Australian Open"], 2, "Roland Garros uses red clay courts."],
    ["How many points is a basketball shot from beyond the arc?", ["1", "2", "3", "4"], 2, "Shots behind the three-point line score 3."],
    ["Usain Bolt is from which country?", ["USA", "Jamaica", "Kenya", "Canada"], 1, "Bolt is Jamaican and holds the 100m world record."],
  ],
  "movies-tv": [
    ["Who directed 'Inception'?", ["Steven Spielberg", "Christopher Nolan", "James Cameron", "Ridley Scott"], 1, "Christopher Nolan released Inception in 2010."],
    ["Which movie features the character Jack Sparrow?", ["Pirates of the Caribbean", "Treasure Island", "Hook", "Waterworld"], 0, "Johnny Depp played Captain Jack Sparrow."],
    ["What is the highest-grossing film of all time (unadjusted)?", ["Titanic", "Avengers: Endgame", "Avatar", "Star Wars"], 2, "Avatar (2009) tops the list after re-releases."],
    ["'Winter is coming' is the motto from which show?", ["The Witcher", "Game of Thrones", "Vikings", "The Crown"], 1, "It's House Stark's words in Game of Thrones."],
    ["Who plays Iron Man in the MCU?", ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"], 1, "RDJ played Tony Stark from 2008 to 2019."],
    ["Which Bollywood film features 'All is well'?", ["PK", "3 Idiots", "Dangal", "Lagaan"], 1, "Rancho's mantra in 3 Idiots (2009)."],
    ["Walter White is the main character of?", ["Ozark", "Breaking Bad", "Narcos", "Dexter"], 1, "Bryan Cranston played Walter White."],
    ["Which studio made 'Toy Story'?", ["DreamWorks", "Pixar", "Illumination", "Blue Sky"], 1, "Pixar's first feature film (1995)."],
  ],
  music: [
    ["How many keys does a standard piano have?", ["76", "84", "88", "96"], 2, "52 white and 36 black keys."],
    ["Who is known as the 'King of Pop'?", ["Elvis Presley", "Michael Jackson", "Prince", "Freddie Mercury"], 1, "Michael Jackson earned the title in the 1980s."],
    ["Which band sang 'Bohemian Rhapsody'?", ["The Beatles", "Queen", "Led Zeppelin", "Pink Floyd"], 1, "Queen released it in 1975."],
    ["How many lines does a musical staff have?", ["4", "5", "6", "7"], 1, "The standard staff has five lines."],
    ["BTS is a group from which country?", ["Japan", "China", "South Korea", "Thailand"], 2, "BTS is a South Korean boy band."],
    ["Which composer went deaf later in life?", ["Mozart", "Bach", "Beethoven", "Chopin"], 2, "Beethoven kept composing despite losing his hearing."],
    ["A.R. Rahman won an Oscar for which film?", ["Lagaan", "Slumdog Millionaire", "Roja", "Rockstar"], 1, "He won two Oscars for Slumdog Millionaire (2009)."],
    ["What instrument has 6 strings typically?", ["Violin", "Guitar", "Cello", "Harp"], 1, "A standard guitar has six strings."],
  ],
  anime: [
    ["What is Naruto's surname?", ["Uchiha", "Uzumaki", "Hatake", "Hyuga"], 1, "Naruto Uzumaki of the Hidden Leaf."],
    ["Luffy wants to become King of the?", ["Ninjas", "Pirates", "Hunters", "Demons"], 1, "One Piece follows Luffy's dream to be Pirate King."],
    ["In Attack on Titan, what surrounds humanity?", ["Forests", "Walls", "Oceans", "Mountains"], 1, "Walls Maria, Rose and Sina."],
    ["Who is Goku's rival in Dragon Ball?", ["Piccolo", "Vegeta", "Frieza", "Krillin"], 1, "Vegeta, the Saiyan prince."],
    ["Tanjiro's sister in Demon Slayer is?", ["Mitsuri", "Nezuko", "Shinobu", "Kanao"], 1, "Nezuko turned into a demon."],
    ["Which studio made 'Spirited Away'?", ["Toei", "Studio Ghibli", "MAPPA", "Madhouse"], 1, "Directed by Hayao Miyazaki at Studio Ghibli."],
    ["Light Yagami owns which notebook?", ["Death Note", "Life Note", "Soul Book", "Dark Diary"], 0, "Death Note lets him kill by writing names."],
    ["In My Hero Academia, what are powers called?", ["Chakra", "Quirks", "Nen", "Stands"], 1, "Superpowers are called Quirks."],
  ],
  space: [
    ["Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Mercury"], 1, "Iron oxide gives Mars its red colour."],
    ["What is the largest planet in our solar system?", ["Saturn", "Jupiter", "Neptune", "Earth"], 1, "Jupiter is over 300 times Earth's mass."],
    ["Who was the first person on the Moon?", ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "Michael Collins"], 2, "Armstrong stepped out on 20 July 1969."],
    ["ISRO's Moon mission that landed near the south pole?", ["Chandrayaan-1", "Chandrayaan-2", "Chandrayaan-3", "Mangalyaan"], 2, "Chandrayaan-3 landed in August 2023."],
    ["What is at the centre of our galaxy?", ["A neutron star", "A supermassive black hole", "The Sun", "A nebula"], 1, "Sagittarius A* is a supermassive black hole."],
    ["How long does light from the Sun take to reach Earth?", ["8 seconds", "8 minutes", "8 hours", "1 day"], 1, "About 8 minutes 20 seconds."],
  ],
  competitive: [
    ["Who is the constitutional head of India?", ["Prime Minister", "President", "Chief Justice", "Speaker"], 1, "The President is the constitutional head of state."],
    ["RBI was established in?", ["1925", "1935", "1947", "1950"], 1, "The Reserve Bank of India began on 1 April 1935."],
    ["Fundamental Rights are in which part of the Constitution?", ["Part II", "Part III", "Part IV", "Part V"], 1, "Articles 12–35 in Part III."],
    ["The national animal of India is?", ["Lion", "Tiger", "Elephant", "Peacock"], 1, "The Bengal tiger."],
    ["Which article abolishes untouchability?", ["Article 14", "Article 17", "Article 21", "Article 32"], 1, "Article 17 abolishes untouchability."],
    ["GST was introduced in India in?", ["2015", "2016", "2017", "2018"], 2, "GST came into force on 1 July 2017."],
    ["Who appoints the Chief Election Commissioner?", ["Prime Minister", "President", "Parliament", "Supreme Court"], 1, "The President appoints the CEC."],
  ],
};

const FLAGS: [string, string][] = [
  ["jp", "Japan"], ["br", "Brazil"], ["in", "India"], ["ca", "Canada"], ["de", "Germany"], ["fr", "France"],
  ["it", "Italy"], ["kr", "South Korea"], ["za", "South Africa"], ["mx", "Mexico"], ["au", "Australia"],
  ["gb", "United Kingdom"], ["us", "United States"], ["cn", "China"], ["ar", "Argentina"], ["se", "Sweden"],
  ["ng", "Nigeria"], ["eg", "Egypt"], ["tr", "Turkey"], ["es", "Spain"], ["np", "Nepal"], ["ch", "Switzerland"],
];

const ALIASES: Record<string, string> = {
  general: "all-rounder", "general-knowledge": "all-rounder", "current-affairs": "competitive",
  "biology-diagrams": "biology", "anime-characters": "anime", gaming: "technology",
  literature: "history", business: "competitive", food: "geography", landmarks: "geography", animals: "biology",
};

const shuffle = <T,>(a: T[]) => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
};

// Shuffle options while keeping the correct answer index accurate
const toQuestion = ([q, opts, correct, exp]: Q, i: number, image_url?: string): BankQuestion => {
  const order = shuffle(opts.map((_, idx) => idx));
  return {
    id: `bank-${i}`, question_text: q, options: order.map(o => opts[o]),
    correct_answer: order.indexOf(correct), explanation: exp, points: 10, image_url,
  };
};

function flagQuestions(): BankQuestion[] {
  return shuffle(FLAGS).map(([code, name], i) => {
    const wrong = shuffle(FLAGS.filter(f => f[1] !== name)).slice(0, 3).map(f => f[1]);
    return toQuestion([`Which country does this flag belong to?`, [name, ...wrong], 0, `This is the flag of ${name}.`], i, `https://flagcdn.com/w640/${code}.png`);
  });
}

export function hasBankCategory(category: string) {
  return category === "flags" || !!BANK[ALIASES[category] ?? category];
}

export function getBankQuestions(category: string, count = 10): BankQuestion[] {
  if (category === "flags") return flagQuestions().slice(0, count);
  const key = ALIASES[category] ?? category;
  const pool = BANK[key] ?? Object.values(BANK).flat();
  return shuffle(pool).slice(0, count).map((q, i) => toQuestion(q, i));
}
