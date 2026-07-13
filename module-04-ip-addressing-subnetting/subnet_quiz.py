"""
Module 04 -- an infinite subnetting drill generator. Every problem is
computed from subnet_calc.py's own logic, so the "answer key" is never
hand-typed anywhere -- it's derived the same way your own answers should be.

Modes:
  python subnet_quiz.py            interactive quiz, 10 questions
  python subnet_quiz.py --auto 5   print 5 generated problems + answers,
                                    no input() required (used to verify the
                                    generator itself produces sane problems --
                                    see DECISIONS.md for why this mode exists)
"""
import random
import sys

from subnet_calc import subnet_info

QUESTION_TYPES = ["network", "broadcast", "first_host", "last_host", "usable_hosts", "netmask"]

QUESTION_TEXT = {
    "network": "What is the NETWORK address of {cidr}?",
    "broadcast": "What is the BROADCAST address of {cidr}?",
    "first_host": "What is the FIRST usable host address in {cidr}?",
    "last_host": "What is the LAST usable host address in {cidr}?",
    "usable_hosts": "How many USABLE HOST addresses does {cidr} have?",
    "netmask": "What is the dotted-decimal NETMASK for {cidr}?",
}

FIELD_FOR_TYPE = {
    "network": "network",
    "broadcast": "broadcast",
    "first_host": "first_host",
    "last_host": "last_host",
    "usable_hosts": "usable_hosts",
    "netmask": "netmask",
}


def random_cidr(rng: random.Random) -> str:
    # Keep prefixes in a range where "usable hosts" questions have a
    # pedagogically interesting, non-trivial answer (not /31 or /32 --
    # subnet_calc.py already covers those edge cases in its own docstring).
    octet1 = rng.choice([10, 172, 192])
    octet2 = rng.randint(0, 255) if octet1 != 172 else rng.randint(16, 31)
    octet3 = rng.randint(0, 255)
    prefix = rng.randint(24, 29)
    # zero out the host bits so the CIDR you're given is already a valid
    # network address, like a real exam question would present it
    ip = f"{octet1}.{octet2}.{octet3}.0"
    info = subnet_info(f"{ip}/{prefix}")
    return f"{info['network']}/{prefix}"


def generate_problem(rng: random.Random) -> dict:
    cidr = random_cidr(rng)
    qtype = rng.choice(QUESTION_TYPES)
    info = subnet_info(cidr)
    answer = info[FIELD_FOR_TYPE[qtype]]
    return {
        "cidr": cidr,
        "qtype": qtype,
        "question": QUESTION_TEXT[qtype].format(cidr=cidr),
        "answer": str(answer),
    }


def run_interactive(num_questions=10, rng=None):
    rng = rng or random.Random()
    score = 0
    for i in range(1, num_questions + 1):
        problem = generate_problem(rng)
        print(f"\nQ{i}. {problem['question']}")
        given = input("> ").strip()
        if given == problem["answer"]:
            print("Correct.")
            score += 1
        else:
            print(f"Incorrect. Correct answer: {problem['answer']}")
    print(f"\nFinal score: {score}/{num_questions}")
    return score


def run_auto(num_questions=5, rng=None):
    """Non-interactive: prints generated problems + answers so the
    generator's own correctness can be checked without a human typing
    answers (used during development/testing of this file itself)."""
    rng = rng or random.Random()
    for i in range(1, num_questions + 1):
        problem = generate_problem(rng)
        print(f"Q{i}. {problem['question']}")
        print(f"    Answer: {problem['answer']}")


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--auto":
        n = int(sys.argv[2]) if len(sys.argv) >= 3 else 5
        run_auto(n)
    else:
        n = int(sys.argv[1]) if len(sys.argv) >= 2 else 10
        run_interactive(n)
