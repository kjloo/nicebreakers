const app = require('../app');
const supertest = require('supertest');

test("GET /acronym", async () => {
    const acronym = "AAAA"
    await supertest(app).get("/acronym")
        .query({ gameID: acronym })
        .expect(200)
        .then((response) => {
            // Check type and length
            expect(response.body.decode).toBeDefined();
            // Check acronym is valid
            const actual = response.body.decode.split(/\s/).reduce((response, word) => response += word.slice(0, 1), '');
            expect(actual).toBe(acronym);
        });
});