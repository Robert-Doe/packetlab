/**
 * Module 04 — JS/Node port of subnet_quiz.py. Same generator logic,
 * built on subnet_calc.js's subnetInfo() as the answer key.
 *
 * Modes:
 *   node subnet_quiz.js            interactive quiz, 10 questions
 *   node subnet_quiz.js --auto 5   non-interactive, prints problems+answers
 */
const readline = require("readline");
const { subnetInfo } = require("./subnet_calc.js");

const QUESTION_TYPES = ["network", "broadcast", "firstHost", "lastHost", "usableHosts", "netmask"];

const QUESTION_TEXT = {
  network: (cidr) => `What is the NETWORK address of ${cidr}?`,
  broadcast: (cidr) => `What is the BROADCAST address of ${cidr}?`,
  firstHost: (cidr) => `What is the FIRST usable host address in ${cidr}?`,
  lastHost: (cidr) => `What is the LAST usable host address in ${cidr}?`,
  usableHosts: (cidr) => `How many USABLE HOST addresses does ${cidr} have?`,
  netmask: (cidr) => `What is the dotted-decimal NETMASK for ${cidr}?`,
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCidr() {
  const first = [10, 172, 192][randInt(0, 2)];
  const second = first === 172 ? randInt(16, 31) : randInt(0, 255);
  const third = randInt(0, 255);
  const prefix = randInt(24, 29);
  const ip = `${first}.${second}.${third}.0`;
  const info = subnetInfo(`${ip}/${prefix}`);
  return `${info.network}/${prefix}`;
}

function generateProblem() {
  const cidr = randomCidr();
  const qtype = QUESTION_TYPES[randInt(0, QUESTION_TYPES.length - 1)];
  const info = subnetInfo(cidr);
  const answer = String(info[qtype]);
  return { cidr, qtype, question: QUESTION_TEXT[qtype](cidr), answer };
}

function runAuto(numQuestions = 5) {
  for (let i = 1; i <= numQuestions; i++) {
    const p = generateProblem();
    console.log(`Q${i}. ${p.question}`);
    console.log(`    Answer: ${p.answer}`);
  }
}

function runInteractive(numQuestions = 10) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  let score = 0;
  let i = 0;

  function next() {
    if (i >= numQuestions) {
      console.log(`\nFinal score: ${score}/${numQuestions}`);
      rl.close();
      return;
    }
    i++;
    const p = generateProblem();
    rl.question(`\nQ${i}. ${p.question}\n> `, (answer) => {
      if (answer.trim() === p.answer) {
        console.log("Correct.");
        score++;
      } else {
        console.log(`Incorrect. Correct answer: ${p.answer}`);
      }
      next();
    });
  }
  next();
}

const args = process.argv.slice(2);
if (args[0] === "--auto") {
  runAuto(Number(args[1]) || 5);
} else {
  runInteractive(Number(args[0]) || 10);
}
