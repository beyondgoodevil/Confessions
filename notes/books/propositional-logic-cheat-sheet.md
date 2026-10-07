---
id: B-0004
date: 2026-01-27
title: Propositional Logic Cheat Sheet
tags: [philosophy, logic]
summary: Connectives, truth tables, how to test validity, the valid forms worth memorising (modus ponens, modus tollens, disjunctive syllogism) and the two invalid look-alikes.
author: Harry J. Gensler
source: "Introduction to Logic, 2nd ed. (Routledge, 2010), chs. 6–7"
---

Propositional logic = arguments that depend on "not", "and", "or", "if-then", "if and only if". Capital letters stand for whole statements. One page to look things up on.

## 1. Symbols

| Symbol | Read | Name | Gensler writes |
|---|---|---|---|
| ¬P | not P | negation | ∼P |
| P ∧ Q | P and Q | conjunction | (P · Q) |
| P ∨ Q | P or Q (or both) | disjunction | (P ∨ Q) |
| P → Q | if P then Q | conditional | (P ⊃ Q) |
| P ↔ Q | P if and only if Q | biconditional | (P ≡ Q) |

- In P → Q, P is the **antecedent**, Q the **consequent**.
- "Or" is inclusive unless you say otherwise.
- Translation traps:
    - "P only if Q" = P → Q (not the other way round)
    - "P unless Q" = P ∨ Q
    - "Not both P and Q" = ¬(P ∧ Q), which is *not* the same as "both not" = (¬P ∧ ¬Q)

## 2. Truth Tables

1 = true, 0 = false.

| P | Q | P ∧ Q | P ∨ Q | P → Q | P ↔ Q |
|---|---|---|---|---|---|
| 0 | 0 | 0 | 0 | 1 | 1 |
| 0 | 1 | 0 | 1 | 1 | 0 |
| 1 | 0 | 0 | 1 | 0 | 0 |
| 1 | 1 | 1 | 1 | 1 | 1 |

- AND: true only when both are.
- OR: false only when both are.
- IF-THEN: false **only** when antecedent true and consequent false. So P → Q is the same as ¬(P ∧ ¬Q).
- This "material" if-then is odd: it's automatically true when P is false. "If pigs fly then I'm rich" comes out true. Relevance logicians hate this. See [[Deviant Logics]].

## 3. Testing Validity

**Truth-table test.** Write out every row. Valid = no row with all premises 1 and conclusion 0.

Modus tollens, checked:

| P | Q | P → Q | ¬Q | ∴ ¬P |
|---|---|---|---|---|
| 0 | 0 | 1 | 1 | 1 |
| 0 | 1 | 1 | 0 | 1 |
| 1 | 0 | 0 | 1 | 0 |
| 1 | 1 | 1 | 0 | 0 |

Only row 1 has both premises true, and there the conclusion is true. Valid.

**Shortcut (truth-assignment test).** Try to *make* premises 1 and conclusion 0. If you're forced into a contradiction, it's valid. If you manage it, you've found a counterexample.

**Tautology** = true in every row, e.g. P ∨ ¬P. **Contradiction** = false in every row, e.g. P ∧ ¬P.

## 4. The Valid Forms to Know

| Name | Form | Example |
|---|---|---|
| **Modus ponens** (MP) | P → Q, P ∴ Q | If it rains the match is off. It's raining. So it's off. |
| **Modus tollens** (MT) | P → Q, ¬Q ∴ ¬P | ...The match isn't off. So it isn't raining. |
| **Disjunctive syllogism** (DS) | P ∨ Q, ¬P ∴ Q | Either the butler or the maid. Not the butler. So the maid. |
| **Conjunctive syllogism** | ¬(P ∧ Q), P ∴ ¬Q | Can't be both in Rome and in Paris. In Rome. So not in Paris. |
| **Hypothetical syllogism** | P → Q, Q → R ∴ P → R | chain of if-thens |
| **Simplification** | P ∧ Q ∴ P | |
| **Reductio** | assume P, derive a contradiction ∴ ¬P | |

Gensler sorts his rules into two piles, which helps:

- **S-rules** (simplify one premise into two smaller bits):
    - P ∧ Q ∴ P, Q
    - ¬(P ∨ Q) ∴ ¬P, ¬Q
    - ¬(P → Q) ∴ P, ¬Q
- **I-rules** (infer from two premises): conjunctive syllogism, disjunctive syllogism, MP, MT.

His proof method is basically reductio every time: assume the opposite of the conclusion, apply S- and I-rules till you hit a contradiction.

## 5. The Two Invalid Look-Alikes

| Name | Form | Why it fails |
|---|---|---|
| **Affirming the consequent** | P → Q, Q ∴ P | Q could be true for another reason. "If it rained the street's wet. The street's wet. So it rained." (Street cleaner.) |
| **Denying the antecedent** | P → Q, ¬P ∴ ¬Q | same problem. "It didn't rain, so the street isn't wet." |

Trick for remembering: with an if-then you may **affirm the front** (MP) or **deny the back** (MT). The other two are the fallacies.

NB affirming the consequent is roughly how scientific confirmation works ("if the theory is true we'd see X; we see X"). That's fine as *induction*, it just isn't deductive proof. Connects to [[The Underdetermination of Data Thesis in the Context of Evolution]].

## 6. Equivalences Worth Knowing

- **Double negation**: ¬¬P = P
- **De Morgan**: ¬(P ∧ Q) = ¬P ∨ ¬Q, and ¬(P ∨ Q) = ¬P ∧ ¬Q
- **Contraposition**: P → Q = ¬Q → ¬P
- **Conditional as "or"**: P → Q = ¬P ∨ Q
- **Not the same**: P → Q and Q → P (the converse). Mixing these up is behind a lot of bad arguments.

## 7. The Laws in Symbols

- Identity: P → P
- Non-contradiction: ¬(P ∧ ¬P)
- Excluded middle: P ∨ ¬P

All three are tautologies on the standard tables. See [[The Classic Laws of Logic]]. Whether the standard tables are the right ones is what [[Deviant Logics]] is about.

## 8. Explosion

From a contradiction anything follows:

1. P (premise)
2. ¬P (premise)
3. P ∨ Q (from 1)
4. Q (from 2 and 3, disjunctive syllogism)

Q can be anything at all. That's why one contradiction in a system is fatal in classical logic, and why "a worldview with a contradiction in it proves everything and so nothing" is more than rhetoric.

## 9. Limits

- Can't see inside statements. "All men are mortal, Socrates is a man ∴ Socrates is mortal" is just P, Q ∴ R here, which looks invalid. Needs quantifiers (∀, ∃).
- Can't handle "must" and "might". That's [[Modal Logic: Necessity and Possibility]].

## Related

- [[Valid vs Sound Arguments]]
- [[Modal Logic: Necessity and Possibility]]
- [[Deviant Logics]]
- [[The Classic Laws of Logic]]
- [[The Fallacy of Circular Reasoning]]
