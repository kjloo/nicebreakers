const acronym_table = {
    A: ['Apple', 'Almond', 'Albino', 'Athlete', 'Ass'],
    B: ['Bannanna', 'Basket', 'Bassoon', 'Bee'],
    C: ['Cast', 'Crow', 'Case', 'Child'],
    D: ['Dinosaur', 'Disc', 'Dog', 'Dad', 'Destiny', 'Daffodil'],
    E: ['Eel', 'Eve', 'Elephant', 'Entertainer', 'Excess', 'Exit'],
    F: ['Frog', 'Face', 'French', 'Falcon'],
    G: ['Giant', 'Goblin', 'Gap', 'Gun'],
    H: ['Hill', 'Hope', 'Horse', 'Hiccup', 'Head'],
    I: ['Ireland', 'Ice', 'Ion', 'Irritant'],
    J: ['Jester', 'Jack', 'Job', 'Jug'],
    K: ['Kite', 'Kangaroo', 'Kid', 'Kiss', 'Knight'],
    L: ['Llama', 'Lord', 'Level', 'List'],
    M: ['Master', 'monster', 'magic', 'minister'],
    N: ['Nun', 'Noon', 'Nap', 'Night', 'Nickel', 'Nine', 'Next', 'Nexus'],
    O: ['Option', 'Orange', 'Original', 'Order'],
    P: ['Pokemon', 'People', 'Pineapple', 'Peach'],
    Q: ['Quilt', 'Quest', 'Quale', 'Queen', 'Query'],
    R: ['Reader', 'Raspberry', 'Rock', 'Rope'],
    S: ['Salmon', 'Silver', 'Sword', 'Silk'],
    T: ['Time', 'Task', 'Torch', 'Talent'],
    U: ['Underwear', 'User', 'Unicorn', 'Uvula'],
    V: ['Vegetable', 'Vegan', 'Virus', 'Vacation'],
    W: ['Watermelon', 'Water', 'West', 'Wombat'],
    X: ['Xylophone', 'Xenophobe'],
    Y: ['Yesterday', 'Youth', 'Yogurt', 'Yoga'],
    Z: ['Zebra', 'Zillion', 'Zygote', 'Zelot']
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