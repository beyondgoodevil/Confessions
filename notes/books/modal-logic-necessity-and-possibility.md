---
id: B-0003
date: 2026-01-22
title: "Modal Logic: Necessity and Possibility"
tags: [philosophy, logic, metaphysics]
summary: Box and diamond, possible worlds, necessary / contingent / impossible, the box-inside vs box-outside ambiguity (and the arguments that trade on it), and the systems T, S4, B, S5.
author: Harry J. Gensler; Theodore Sider
source: "Gensler, Introduction to Logic, 2nd ed. (Routledge, 2010), chs. 10–11; Conee and Sider, Riddles of Existence (OUP, 2005), ch. 9"
---

Modal logic = arguments that turn on "necessary", "possible", "must", "can't". Adds two symbols to propositional logic.

## 1. Box and Diamond

| Symbol | Read | In possible-worlds talk |
|---|---|---|
| ◇A | it's possible that A | A is true in **some** possible world |
| A | A | A is true in the **actual** world |
| □A | it's necessary that A | A is true in **all** possible worlds |

- Strength: □A is stronger than A, which is stronger than ◇A. So □A ∴ A ∴ ◇A, never backwards.
- "Possible" here = **logically** possible, not self-contradictory. Running a mile in two minutes is physically impossible but logically possible.
- "Necessary" = self-contradictory to deny. 2+2=4. All bachelors are unmarried.
- A **possible world** = a consistent and complete story of how things might have been. The actual world is the story that's true.

They define each other:

- □A = ¬◇¬A (necessary = not possibly false)
- ◇A = ¬□¬A (possible = not necessarily false)

## 2. Translations

| English | Symbols |
|---|---|
| A is impossible | ¬◇A (or □¬A) |
| A is consistent with B | ◇(A ∧ B) |
| A entails B | □(A → B) |
| A is inconsistent with B | ¬◇(A ∧ B) |
| A is a contingent statement | ◇A ∧ ◇¬A |
| A is a contingent truth | A ∧ ◇¬A |

- Statements are necessary, impossible, or contingent. *Truths* are only necessary or contingent.
- "Entails" is stronger than plain if-then. "Rain entails precipitation" holds in every world. "If it's Saturday I don't teach" just happens to be so.

## 3. The Ambiguity That Matters

"If you're a bachelor, then you must be unmarried." Two readings:

| | Box inside | Box outside |
|---|---|---|
| Symbols | B → □U | □(B → U) |
| Says | given that you're a bachelor, "you're unmarried" is *in itself* necessary. Nobody could ever marry you | the *connection* is necessary: no world where you're a bachelor and married |
| Medieval name | necessity of the **consequent** | necessity of the **consequence** |
| True? | false (and rude) | trivially true |

- English "if A then *must* B" nearly always *means* box-outside but *sounds* like box-inside.
- Gensler: several "intriguing but fallacious philosophical arguments" depend on this.

**Where it bites: foreknowledge and fatalism.**

1. Necessarily, if God knows I'll do X, I'll do X. → □(K → X). True.
2. God knows I'll do X. → K
3. ∴ I *necessarily* do X. → □X ??

Doesn't follow. From □(K → X) and K you get X, not □X. To get □X you'd need box-inside (K → □X), which is the thing in dispute, or □K. This is the formal version of what's in [[Free Will and Divine Foreknowledge]] sec. 3.

Same slip in the old sea-battle argument: "necessarily (there will be a battle tomorrow or there won't)" is □(P ∨ ¬P). It doesn't give you □P ∨ □¬P. (Gensler has "it's necessary that it's heads or tails" vs "either necessarily heads or necessarily tails" as a pair of exercises.)

## 4. How Proofs Work

Rough idea only:

- Lines are tagged with a world: no tag = actual world, W = some other world, WW = another, etc.
- **Drop a diamond**: from ◇A go to A in a *new* world. (Possible means true somewhere, so name the somewhere.)
- **Drop a box**: from □A go to A in *any* world you like. (Necessary means true everywhere.)
- Then it's ordinary propositional reductio inside each world.

Example, why □A ∴ ◇A is valid: assume ¬◇A, i.e. □¬A. Drop both boxes into the actual world: A and ¬A. Contradiction.

## 5. Four Systems

Logicians mostly agree on modal arguments until one modal operator sits inside another (□□A, ◇□A). Then it depends on how free you are with the drop-box rule. Gensler's picture is "galactic travel": dropping a diamond from world 1 into world 2 gives you a **ticket** 1 ⇒ 2, and the systems differ on how tickets can be used.

| System | Drop a box into... | Extra thing it proves |
|---|---|---|
| **T** | a world you hold a direct ticket to | just □A → A |
| **S4** | also via a chain of tickets | □A → □□A |
| **B** | also backwards along a ticket | A → □◇A |
| **S5** | any world from any world | all of the above, plus ◇A → □◇A |

- T is weakest, S5 strongest. S4 and B are in between and neither contains the other.
- S5 says: whatever is necessary anywhere is necessary everywhere, and whatever is possible is necessarily possible. Most philosophers use S5 for logical / metaphysical necessity.
- Why care: Plantinga's modal ontological argument needs S5. "Possibly, a necessary being exists" (◇□G) gives □G only in S5 (in B you get as far as G). So the whole fight is over the possibility premise and over which system is right.

## 6. Quantified Modal Logic

(ch. 11, skimmed)

- Mixing □ with "all" and "some" brings in ***de dicto* vs *de re***:
    - *de dicto*: □(all bachelors are unmarried). The statement is necessary.
    - *de re*: this person is necessarily F. The thing has the property essentially.
- *De re* necessity = **Aristotelian essentialism**: things have some properties necessarily and others accidentally. Quine thought this was nonsense. Gensler thinks it's defensible.
- Relevant to the essence talk in the theology notes. "Socrates is necessarily human" is a *de re* claim.

## 7. Other "Modal" Logics Built the Same Way

Same machinery, different reading of the box:

- **Deontic**: □ = obligatory, ◇ = permissible. (Here □A → A fails! Ought doesn't imply is.) See [[Is Ought]].
- **Epistemic / belief**: □ = known / believed.
- **Temporal**: □ = always, ◇ = sometimes.

## 8. What Are Necessity and Possibility, Though?

Added from Sider's chapter in *Riddles of Existence* (ch. 9). The logic above tells you how □ and ◇ behave. It doesn't tell you what makes a □-statement true. Hume's point: you can observe that a stone falls, never that it *must*.

First, sort the senses of "possible":

| Kind | "Must" means | Example |
|---|---|---|
| epistemic | for all I know | "It's possible they won; I don't follow it" |
| moral (deontic) | required | "You must not murder" |
| **natural** | given the laws of nature | a dropped stone must fall |
| **absolute** | no matter what | bachelors must be unmarried |

- Absolute possibility is the widest: breaking the laws of nature is absolutely possible (you can imagine the stone hovering). Absolute necessity is the narrowest.
- Sider's "absolute" = what Gensler calls logical necessity, roughly. Others say "metaphysical".
- Philosophy cares about the absolute kind because it's after **essences**: what's true of a thing in every possible case. That's why thought experiments about cases that never happen are fair.

### Natural necessity: what is a law?

- **Divine legislation.** God decrees the laws. Sider's objection: God also decrees non-laws (say, that the number of trees in North America is odd). So what's the *extra* thing He does to make something a law? The theory doesn't say.
- **Regularity theory** (Hume). A law is just a pattern with no exceptions. Demystifies laws. Problems:
    1. leaves out the *must*
    2. the law can't explain the pattern if it *is* the pattern
    3. makes laws global (about all of space and time) when necessity seems local
    4. accidental regularities: "no Thursday dinner party ever has more than N guests" is exceptionless and obviously not a law
- **Universals theory** (Armstrong). A law is one universal *necessitating* another. Fixes all four. But "necessitates" is unexplained. His silencer joke: "the gun is built so the sound doesn't get out."

Same choice as Poellner's Nietzsche on causation: regularities with no "must", or a "must" nobody can explain. See [[Nietzsche: The Will to Power]] sec. 5.

On the divine theory: the objection assumes God's willing is all of one kind. The Maximus picture has an answer of sorts. A law would follow from the *logoi* of natures (what methane and oxygen are), where the number of trees is providence over particulars. See [[The Logoi of Creation in St. Maximus]].

### Absolute necessity: two theories

**Possible worlds, taken literally** (David Lewis)

- Every way things could have been *is* a world, as real as ours, with its own space and time. No travel between them. "Actual" just means "this one".
- Necessary = true in all worlds. Possible = true in some.
- Gain: fully demystifies □ and ◇. No ghostly possibilities.
- Cost: you have to believe in real flying pigs. Lewis says it's worth it for the theory, like believing in electrons. Sider can't bring himself to.

**Conventionalism** (Ayer)

- Necessary = true by definition. Necessity comes from how we use words.
- Cheap, no extra worlds.
- Problems:
    - **Essences of individuals.** Clinton could have been shorter, or never president. Could he have been a *flower*? No. So "Clinton is human" is necessary. But a name has no definition for that to follow from. (This is the *de re* necessity of sec. 6.)
    - **Philosophy would be dictionary work.** If all necessity is definitional, questions about what justice or knowledge essentially is get settled by looking words up. Conventionalists often accept this. It's a big deflation.
- Gensler's objection to conventionalism about logic applies here too: it makes necessity depend on our decisions. See [[Philosophy of Logic: What Grounds the Laws of Logic]] sec. 3.4.

Missing from Sider's chapter: the middle view that possible worlds are *abstract* (maximal consistent stories, Gensler's version; Plantinga's "states of affairs"), and the old view that what's possible is grounded in what God can do. The Oxford Handbook has two chapters on this (Fine on possibilia, Sider on reductive theories) that I haven't read.

## 9. Loose Ends

- Are possible worlds real things (David Lewis) or just stories / abstract objects (Gensler's "consistent descriptions")? Where would they be grounded? There's an old answer that possibilities are grounded in God's power and ideas, which fits with [[The Logoi of Creation in St. Maximus]].
- Logical vs metaphysical necessity. "Water is H₂O" is supposed to be necessary but not known a priori (Kripke). Not in Gensler's chapter.

## Related

- [[Propositional Logic Cheat Sheet]]
- [[Valid vs Sound Arguments]]
- [[Deviant Logics]]
- [[Free Will and Divine Foreknowledge]]
- [[Is Ought]]
- [[The Classic Laws of Logic]]
- [[The Problem of Universals: Realism vs Nominalism]]
- [[The Logoi of Creation in St. Maximus]]
- [[Philosophy of Logic: What Grounds the Laws of Logic]]
- [[The Ontological Argument]]
- [[The Leibnizian Cosmological Argument]]
