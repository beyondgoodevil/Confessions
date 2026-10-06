---
id: B-0014
date: 2026-10-07
title: "Modal Logic: Necessity and Possibility"
tags: [philosophy, logic, metaphysics]
summary: Box and diamond, possible worlds, necessary / contingent / impossible, the box-inside vs box-outside ambiguity (and the arguments that trade on it), and the systems T, S4, B, S5.
author: Harry J. Gensler
source: "Introduction to Logic, 2nd ed. (Routledge, 2010), chs. 10–11"
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

## 8. Loose Ends

- Are possible worlds real things (David Lewis) or just stories / abstract objects (Gensler's "consistent descriptions")? Where would they be grounded? There's an old answer that possibilities are grounded in God's power and ideas, which fits with [[The Logoi of Creation in St. Maximus]].
- Logical vs metaphysical necessity. "Water is H₂O" is supposed to be necessary but not known a priori (Kripke). Not in Gensler's chapter.

## Related

- [[Propositional Logic Cheat Sheet]]
- [[Valid vs Sound Arguments]]
- [[Deviant Logics]]
- [[Free Will and Divine Foreknowledge]]
- [[Is Ought]]
- [[The Classic Laws of Logic]]
