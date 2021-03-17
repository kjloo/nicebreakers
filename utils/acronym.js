const acronym_table = {
    A: ['Apple', 'Almond', 'Albino', 'Athlete', 'Ass', 'Alien', 'Alpaca', 'America', 'Australia'],
    B: ['Banana', 'Basket', 'Bassoon', 'Bee', 'Bass', 'Brunch', 'Breakfast', 'Bunny', 'Boston'],
    C: ['Cast', 'Crow', 'Case', 'Child', 'Church', 'Chicken', 'Chile', 'Capcom', 'Captain', 'Century'],
    D: ['Dinosaur', 'Disc', 'Dog', 'Dad', 'Destiny', 'Daffodil', 'Dunkirk', 'Devil', 'Darkness'],
    E: ['Eel', 'Eve', 'Elephant', 'Entertainer', 'Excess', 'Exit', 'Europe', 'Elf', 'Eleven'],
    F: ['Frog', 'Face', 'France', 'Falcon', 'Five', 'Fifty', 'Food', 'Fun', 'Factory', 'Flight'],
    G: ['Giant', 'Goblin', 'Gap', 'Gun', 'Germany', 'Gastronomy', 'Garbage', 'Grandma', 'Grandpa'],
    H: ['Hill', 'Hope', 'Horse', 'Hiccup', 'Head', 'Hungary', 'Husky', 'Human', 'Horn', 'Hospital'],
    I: ['Ireland', 'Ice', 'Ion', 'Irritant', 'Icarus', 'Isotope', 'Ibex', 'Icon'],
    J: ['Jester', 'Jack', 'Job', 'Jug', 'Juggler', 'Jupiter', 'Jock', 'Jig'],
    K: ['Kite', 'Kangaroo', 'Kid', 'Kiss', 'Karma', 'Killer', 'Kaleidescope', 'Kedgeree', 'Keyboard', 'Ketchup'],
    L: ['Llama', 'Lord', 'Level', 'List', 'Lunchbox', 'Letter', 'Landscape', 'Left', 'Love', 'Lebenon'],
    M: ['Master', 'Monster', 'Magic', 'Minister', 'Music', 'Musical', 'Mustard', 'Mayor', 'Manor', 'March'],
    N: ['Nun', 'Noon', 'Nap', 'Nixon', 'Nickel', 'Nine', 'Next', 'Nexus', 'Ninety', 'Neptune', 'Normandy', 'Number'],
    O: ['Option', 'Orange', 'Original', 'Order', 'One', 'Octagon', 'Oval', 'Ostrich', 'Opal', 'Orangutan'],
    P: ['Pokemon', 'People', 'Pineapple', 'Peach', 'Pipe', 'Pistol', 'Pervert', 'Person', 'Pasta', 'Porche'],
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

const processAcronym = (code) => {
    let rc = []
    // get a word for each letter
    for (let i = 0; i < code.length; i++) {
        let letter = code.charAt(i);
        let list = acronym_table[letter];
        let word = list[Math.floor(Math.random() * list.length)];
        rc.push(word);
    }
    return rc.join(' ');
}

exports.processAcronym = processAcronym;