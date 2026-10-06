---
id: B-0012
date: 2026-10-07
title: Deviant Logics
tags: [philosophy, logic, epistemology]
summary: Logics that drop a standard assumption. Many-valued (more than true/false), paraconsistent (some contradictions true), intuitionist (no excluded middle), relevance (stricter if-then). What each rejects, why, and the standard replies.
author: Harry J. Gensler
source: "Introduction to Logic, 2nd ed. (Routledge, 2010), ch. 17"
---

"Deviant" = rejects something classical logic takes for granted. Since Aristotle the assumptions have been: every statement is true or false, not both, and those are the only two values. Each logic below gives up one of these (or the standard if-then).

Matters for the apologetics notes because [[TAG]] leans on "the laws of logic". Someone will say "which logic?"

## 1. Overview

| Logic | Rejects | Slogan | Main name |
|---|---|---|---|
| Many-valued | bivalence | more than two truth values | Łukasiewicz; fuzzy logic (Zadeh) |
| Paraconsistent | explosion (and, for dialetheists, non-contradiction) | some contradictions are true | Graham Priest |
| Intuitionist | excluded middle, double negation | truth = provability | Brouwer, Heyting |
| Relevance | material implication | "if" needs a real connection | Anderson and Belnap |

## 2. Many-Valued Logic

- Classical: only 1 and 0 (**bivalence**). Gensler notes this is compatible with truth-value *gaps* for meaningless or vague sentences. Logic just doesn't bother with those.
- Three-valued: add ½ = "half-true". Could mean unknowable, vague, unproved, meaningless, or about a future not yet settled.

| P | ¬P |
|---|---|
| 0 | 1 |
| ½ | ½ |
| 1 | 0 |

- AND takes the lower value, OR the higher. If-then is true if the consequent is at least as true as the antecedent.
- Result: P ∨ ¬P and ¬(P ∧ ¬P) are sometimes only **half-true** (when P = ½). So excluded middle and non-contradiction stop being laws.
- **Fuzzy logic**: infinitely many values, 0.00 to 1.00. Then even modus ponens can fail (A at .9 and A→B at .9 can leave B below .9).
- Used in engineering (the clothes-dryer example: heat turned down *to the degree* the shirts are dry).
- Reply: you can get the same result in ordinary logic by putting the degree in the *predicate* ("dry to degree n") instead of in truth. So it's not clear anything about truth has been shown.
- Also critics: weird, arbitrary, little use for real arguments.

## 3. Paraconsistent Logic and Dialetheism

**Aristotle's law of non-contradiction** (LNC): the same property can't both belong and not belong to the same thing at the same time in the same respect. He thought it certain but unprovable, and that anyone denying it uses it in the act. (*Metaphysics* Gamma.)

Who denies it:

- Heraclitus (according to Aristotle).
- Hegel, Marx: contradictions in reality drive history. Standard criticism: that mixes up *conflicting forces* (hot/cold, capital/labour) with *logical* contradictions.
- **Graham Priest**, dialetheism: *some* (not all) statements are both true and false.

Candidate true contradictions, and the stock answer:

| Claim | Stock answer |
|---|---|
| "We do and do not step into the same river" | different senses of "same river" |
| "God is spirit and is not spirit" (Pseudo-Dionysius) | apophatic: not spirit *in our sense* |
| "The moving ball is here and not here" | |
| "Sara is a child and not a child" | child in age, not in sophistication |
| "This sentence is false" (liar) | the hard one |

Most logicians: these aren't real "A and not-A" because the two A's mean different things. Standard logic assumes P means the same throughout. "I went to Paris and I didn't go to Paris" (landed at the airport, saw nothing) is really P ∧ ¬Q.

The Dionysius example is interesting to see in a logic textbook. Apophatic theology isn't asserting a contradiction; it's denying that our concepts apply to God the way they apply to creatures. See [[Essence-Energies Distinction]].

**Explosion.** In classical logic, A and ¬A together prove any B at all (A; so A ∨ B; ¬A; so B). So one accepted contradiction means you accept everything. Gensler calls it "contradictitis".

**The paraconsistent move.** Reject explosion by rejecting **disjunctive syllogism** (A ∨ B, ¬A ∴ B). If A is both true and false, the premises can be true while B is false. This lets you quarantine a contradiction.

Objections:

1. What's left of "not"? If ¬A doesn't have to have the opposite value from A, it isn't negation any more.
2. Lets sloppy thinkers off the hook. ("Yes I contradicted myself, I'm using the new logic.")
3. Giving up disjunctive syllogism is a huge cost. "A or B did it. Not A. So B" is how every detective works.

A more modest use: you don't have to believe in true contradictions to want a logic that copes with **inconsistent data** (a messy database, conflicting witness statements) without concluding everything. Reply: inconsistent data contains an error, so find the most probable consistent subset and use ordinary logic on that.

Two attitudes among people who keep LNC:

- it's a (very good) **convention** about how we talk
- it's a **metaphysical truth** about reality, and dialetheism is "clever but incoherent metaphysics"

## 4. Intuitionist Logic

- Rejects **excluded middle** (A ∨ ¬A) and **double negation** (¬¬A → A), at least for infinite domains.
- Background is a view of maths: numbers are constructions of the mind, and a mathematical statement is true only if we can **prove** it.
- Example: Goldbach's conjecture (every even number is the sum of two primes). Not proved, not disproved. Realist: it's true or false anyway. Intuitionist: if neither it nor its negation is provable, neither is true.
- For finite cases excluded middle is fine (you could check them all).
- Same move outside maths: if "true" = "verified by my experience", then lots of things are neither true nor false, e.g. "There is a God" and "There is no God" both come out *false*.
- Realist reply: this confuses **true** with **verified**. There can be unverified truths. Bad metaphysics, not a discovery about logic.

Note the pattern: the deviant logic follows from a prior theory of truth (truth = provability / verification). So the argument is really about truth. See [[Philosophy of Logic: What Grounds the Laws of Logic]] sec. 5.

## 5. Relevance Logic

- Classical "if P then Q" (**material implication**) just means not (P and not-Q). So it's true whenever P is false or Q is true.
- **Paradoxes of material implication**:
    - from ¬A infer "if A then B". Pigs don't fly ∴ if pigs fly, I'm rich.
    - from B infer "if A then B". Pigs don't fly ∴ if I'm rich, pigs don't fly.
- Relevance logicians: an if-then is true only if antecedent and consequent are **relevant** to each other. At minimum they should share a letter. So "(P ∧ ¬P) → Q" shouldn't be a theorem. Natural allies of paraconsistent logic.

Replies:

- **Grice**: the paradoxes are odd to *say*, not false. Rule of conversation: don't make a weaker claim when you could make a stronger one. If I know ¬P, saying "if P then Q" is misleading, but it's still true. (Compare "at least three of you will get presents" when you know all five will.)
- You can derive the "paradox" by steps that each look fine: A ∴ A or B ∴ if not-A then B. Relevance logic has to reject one of those steps, which is at least as odd.
- There are many relevance logics and they don't agree with each other.

**Attacks on modus ponens.**

- Measles: "If you have red spots you have measles. You have red spots. ∴ measles." But there could be another cause!
- McGee's 1980 election case: "If a Republican wins, then if it's not Reagan it'll be Anderson. A Republican will win. ∴ If it's not Reagan it'll be Anderson." Premises believable, conclusion not (it would be Carter).
- Reply: both confuse a real if-then with a **conditional probability** ("probably measles, given spots"). Taken as a strict if-then, the measles premise is simply false if there are other causes.

Gensler's point at the end: "if" comes in a whole family (material, strict entailment □(A→B), counterfactual, conditional probability, conversational suggestion). A lot of the trouble is from not saying which one you mean.

## 6. Gensler's Verdict, and Mine

- His: deviant logics are worth studying because they make you think harder, but "most assumptions about logic that have been held since the time of Aristotle" are solid. He compares it to "I see a chair": philosophers can raise problems for anything, and not every alternative is equally reasonable. (He makes one exception, free logic in quantified modal logic.)
- Mine, for now:
    - None of these is "anything goes". Each keeps most of classical logic and argues, *using* shared inferences, for dropping one bit. Priest argues for dialetheism with ordinary valid arguments. So they aren't counterexamples to "you need logic to argue".
    - But they do show that "the laws of logic" needs saying carefully. A TAG-style argument should claim that *some* objective, non-arbitrary norms of inference are required, and then ask what grounds them, not assume the three classical laws are beyond question.
    - Nearly every deviant logic is driven by a theory of truth or meaning. So the real disagreement is one level down.

Still to read: Priest, *An Introduction to Non-Classical Logic* (Gensler recommends it as the best case for the other side).

## Related

- [[Philosophy of Logic: What Grounds the Laws of Logic]]
- [[Propositional Logic Cheat Sheet]]
- [[Modal Logic: Necessity and Possibility]]
- [[The Classic Laws of Logic]]
- [[TAG]]
- [[TAG: Logic and Its Justification in Other World Views - A Refutation]]
- [[Would Aliens Have to Operate on Logic]]
- [[Relativism]]
- [[Nietzsche and the Greeks]]
