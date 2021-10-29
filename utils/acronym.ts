import logger from './logger';

const acronymTable = {
    A: ['Apple', 'Almond', 'Albino', 'Athlete', 'Assassin', 'Assistant', 'Astronomer', 'Alien', 'Alpaca', 'America', 'Australia', 'Africa', 'Anonymous', 'Ace'],
    B: ['Banana', 'Basket', 'Bassoon', 'Bee', 'Bass', 'Brunch', 'Breakfast', 'Bunny', 'Boston', 'Bullet'],
    C: ['Cast', 'Crow', 'Case', 'Child', 'Church', 'Chicken', 'Chile', 'Capcom', 'Captain', 'Century', 'Corner'],
    D: ['Dinosaur', 'Disc', 'Dog', 'Dad', 'Destiny', 'Daffodil', 'Dunkirk', 'Devil', 'Darkness', 'Dip'],
    E: ['Eel', 'Eve', 'Elephant', 'Entertainer', 'Excess', 'Exit', 'Europe', 'Elf', 'Eleven', 'Easter'],
    F: ['Frog', 'Face', 'France', 'Falcon', 'Five', 'Fifty', 'Food', 'Fun', 'Factory', 'Flight', 'Fish'],
    G: ['Giant', 'Goblin', 'Gap', 'Gun', 'Germany', 'Gastronomy', 'Garbage', 'Grandma', 'Grandpa', 'Goo'],
    H: ['Hill', 'Hope', 'Horse', 'Hiccup', 'Head', 'Hungary', 'Husky', 'Human', 'Horn', 'Hospital', 'Hippopotamus'],
    I: ['Ireland', 'Ice', 'Ion', 'Irritant', 'Icarus', 'Isotope', 'Ibex', 'Icon', 'Internet'],
    J: ['Jester', 'Jack', 'Job', 'Jug', 'Juggler', 'Jupiter', 'Jock', 'Jig', 'Japan'],
    K: ['Kite', 'Kangaroo', 'Kid', 'Kiss', 'Karma', 'Killer', 'Kaleidescope', 'Kedgeree', 'Keyboard', 'Ketchup', 'Kobold'],
    L: ['Llama', 'Lord', 'Level', 'List', 'Lunchbox', 'Letter', 'Landscape', 'Left', 'Love', 'Lebenon'],
    M: ['Master', 'Monster', 'Magic', 'Minister', 'Music', 'Musical', 'Mustard', 'Mayor', 'Manor', 'March'],
    N: ['Nun', 'Noon', 'Nap', 'Nixon', 'Nickel', 'Nine', 'Next', 'Nexus', 'Ninety', 'Neptune', 'Normandy', 'Number'],
    O: ['Option', 'Orange', 'Original', 'Order', 'One', 'Octagon', 'Oval', 'Ostrich', 'Opal', 'Orangutan'],
    P: ['Pharaoh', 'Peru', 'Pokemon', 'People', 'Pineapple', 'Peach', 'Pipe', 'Pistol', 'Periscope', 'Pork', 'Picture', 'Pascal', 'Person', 'Pasta', 'Porche'],
    Q: ['Quilt', 'Quest', 'Quale', 'Queen', 'Query', 'Quack', 'Question', 'Quitter'],
    R: ['Reader', 'Raspberry', 'Rock', 'Rope', 'Revolver', 'Rome', 'Romeo', 'Rust'],
    S: ['Salmon', 'Silver', 'Sword', 'Silk', 'Seven', 'Shroud', 'Saxaphone', 'Service', 'Serpent', 'Snake', 'Sniper'],
    T: ['Time', 'Task', 'Torch', 'Talent', 'Twelve', 'Trumpet', 'Taxonomy', 'Tungsten', 'Turkey'],
    U: ['Underwear', 'User', 'Unicorn', 'Uvula', 'Umbrella', 'Up', 'Ulysses', 'Uganda', 'Underwriter', 'Undertaker'],
    V: ['Vegetable', 'Vegan', 'Virus', 'Vacation', 'Venus', 'Voice', 'Vampire', 'Vocation', 'Violin', 'Versailles'],
    W: ['Watermelon', 'Water', 'West', 'Wombat', 'Wonder', 'Weekend', 'Westeros', 'Woman', 'Welcome', 'Warehouse', 'Warranty'],
    X: ['Xylophone', 'Xenophobe', 'Xenogenesis', 'Xenon'],
    Y: ['Yesterday', 'Youth', 'Yogurt', 'Yoga', 'Yacht', 'Yahoo', 'Yak', 'Yard', 'Yankee', 'Yesterday'],
    Z: ['Zebra', 'Zillion', 'Zygote', 'Zealot', 'Zeitgeist', 'Zenith', 'Zephyr', 'Zigzag', 'Zipline', 'Zipper']
}

export function processAcronym(code: string): string {
    let rc = []
    code = code.toUpperCase();
    // get a word for each letter
    for (let i = 0; i < code.length; i++) {
        let letter = code.charAt(i);
        // Validate letter in table
        if (!(letter in acronymTable)) {
            logger.error("Could not find " + letter + " in table");
            return "";
        }
        let list = acronymTable[letter];
        let word = list[Math.floor(Math.random() * list.length)];
        rc.push(word);
    }
    return rc.join(' ');
}