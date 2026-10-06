---
id: B-0017
date: 2026-10-07
title: Valid vs Sound Arguments
tags: [philosophy, logic]
summary: The basic vocabulary. Argument, valid, sound, logical form, the three ways to attack an argument, deductive vs inductive.
author: Harry J. Gensler
source: "Introduction to Logic, 2nd ed. (Routledge, 2010), ch. 1"
---

First-chapter stuff from Gensler, but everything else depends on it and people (me included) mix the words up constantly.

## 1. Argument

- An **argument** = premises + a conclusion. Premises are the evidence, the conclusion is what they're supposed to support.
- **Logic** = analysing and appraising arguments.
- ∴ means "therefore".

## 2. Valid

> **Valid**: it would be contradictory (impossible) for the premises to be all true and the conclusion false.

- Says *nothing* about whether the premises are true. Only that the conclusion follows.
- Assumes the words mean the same thing all the way through. (If they shift, that's equivocation.)

Gensler's test question, which about half his students get wrong:

| | |
|---|---|
| If you overslept, you'll be late. | If you overslept, you'll be late. |
| You aren't late. | You didn't oversleep. |
| ∴ You didn't oversleep. | ∴ You aren't late. |
| **valid** | **invalid** |

Second one fails because you could be late for some other reason (car wouldn't start).

## 3. Form

Validity comes from **form**, not content. Swap in letters:

| Valid | Invalid |
|---|---|
| If A then B | If A then B |
| Not-B | Not-A |
| ∴ Not-A | ∴ Not-B |

- Any argument with the left form is valid, whatever A and B are. "If you're in France you're in Europe; you're not in Europe; so you're not in France."
- Same content in the right-hand form: "you're not in France; so you're not in Europe." You might be in Italy.
- Left = modus tollens. Right = denying the antecedent. See [[Propositional Logic Cheat Sheet]].
- This is why logic is "topic-neutral". The same forms work for cooking, physics, theology.

## 4. Sound

> **Sound**: valid **and** every premise true.

- Conclusion of a sound argument is always true.
- Two ways to be unsound:

| False premise | Doesn't follow |
|---|---|
| All logicians are millionaires. | All millionaires eat well. |
| Gensler is a logician. | Gensler eats well. |
| ∴ Gensler is a millionaire. | ∴ Gensler is a millionaire. |
| valid, unsound | invalid |

So the combinations:

| | premises all true | a premise false |
|---|---|---|
| **valid** | sound, conclusion must be true | unsound, conclusion could be either |
| **invalid** | unsound, conclusion could be either | unsound, conclusion could be either |

Only the top-left box guarantees anything.

## 5. How to Attack an Argument

Three options, and only three:

1. Show a **premise is false**.
2. Show the **conclusion doesn't follow** (invalid).
3. Show a premise is **very uncertain**. Weaker, but arguments are only as strong as their premises.

Things to remember:

- Refuting an argument **doesn't refute its conclusion**. The conclusion might still be true and there might be a better argument for it. To show a view is false you need your own argument against it.
- Once someone gives a valid argument, "well, my opinion is different" isn't a reply. You have to pick a premise. (Gensler's example is Michelle Obama on the "Bradley effect" in 2008. Valid, so the only question was whether premise 2 was true.)

This is useful for the apologetics notes. Most of the listed fallacies are really ways of failing 1 or 2 while looking like you haven't.

## 6. Usage

- **Statements** are true or false.
- **Arguments** are valid or invalid, sound or unsound.
- "That's a valid point", "a false argument": fine in ordinary speech, wrong in logic.

## 7. Deductive vs Inductive

| Deductive | Inductive |
|---|---|
| conclusion claimed to follow *necessarily* | conclusion claimed to follow *probably* |
| All who live in France live in Europe. Pierre lives in France. ∴ Pierre lives in Europe. | Most who live in France speak French. Pierre lives in France. That's all we know. ∴ Pierre (probably) speaks French. |
| valid / invalid | strong / weak |

- An inductive argument can have true premises and a false conclusion without anything having gone wrong (Pierre is the Polish ambassador's son).
- "Valid" only applies to the left column.

## 8. To Follow Up

- Gensler says untrained intuitions about validity are unreliable but trainable. Interesting next to the question of what makes the laws valid at all. See [[Philosophy of Logic: What Grounds the Laws of Logic]].
- Circular arguments are technically *valid* (if P then P). So why are they bad? Because they don't give anyone a reason. See [[The Fallacy of Circular Reasoning]].

## Related

- [[Propositional Logic Cheat Sheet]]
- [[Modal Logic: Necessity and Possibility]]
- [[Philosophy of Logic: What Grounds the Laws of Logic]]
- [[The Classic Laws of Logic]]
- [[The Fallacy of Circular Reasoning]]
- [[Hasty Generalization Fallacy]]
