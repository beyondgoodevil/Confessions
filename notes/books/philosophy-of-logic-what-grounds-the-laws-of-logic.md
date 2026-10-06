---
id: B-0015
date: 2026-10-07
title: "Philosophy of Logic: What Grounds the Laws of Logic"
tags: [philosophy, theology, logic, metaphysics, apologetics]
summary: Gensler's survey. Abstract entities, whether logic shows the structure of reality, five accounts of why logical laws hold (supernaturalism, psychologism, pragmatism, conventionalism, realism), truth and the liar. Plus my notes on the Orthodox angle.
author: Harry J. Gensler
source: "Introduction to Logic, 2nd ed. (Routledge, 2010), ch. 18"
---

Logicians mostly agree on *what* the laws are. They don't agree on what they're based on or how we know them. This is the chapter closest to the TAG material, so I've gone through it slowly. Last section is mine.

## 1. Does Logic Need Abstract Entities?

Take "This is green. This is an apple. ∴ Some apple is green." Talking about it, you seem to mention:

- the **set** of green things
- the **property** greenness
- the **concept** green (what the word means in any language)
- the **word** "green" / the **sentence** "This is green" as repeatable patterns
- the **proposition** that this is green (what's true when you say it in any language)

None of those is a physical object or somebody's feeling.

| View | Says |
|---|---|
| **Platonism** (logicians' sense) | abstract objects exist, full stop |
| **Nominalism** | only concrete physical or mental things. Has to make sense of logic without the above |
| In between | they're creations / fictions of the mind |

Same fight as [[The Problem of Universals: Realism vs Nominalism]], in modern dress.

## 2. Does Logic Show the Structure of Reality?

- **Early Wittgenstein** (*Tractatus*): yes. World = totality of facts. Atomic statements picture simple facts. Complex statements are built with the connectives (he invented truth tables for this). Anything not built that way is nonsense, which includes ethics, God, and, awkwardly, the *Tractatus* itself.
- **Russell**, logical atomism: similar but with quantifiers. Logical analysis also cures bad metaphysics: "nothing is in the box" doesn't name a thing called Nothing. "The average American" is a **logical construct**.
- **Quine**: "To be is to be the value of a bound variable." Your theory is committed to whatever its "for some x" has to range over. He accepted sets (science needs them), rejected properties and propositions as unclear.
- **Later Wittgenstein** (*Investigations*): took it back. "Don't think, but look!" No strict definition of "game", only family resemblances. No one ideal language mirroring reality. Logic is one **language game** among others, made for checking reasoning.

So the range is from "logic is the skeleton of the world" to "logic is a tool we made".

## 3. Why Are the Laws of Logic Correct?

Test cases: modus ponens, and non-contradiction. Five answers.

### 3.1 Supernaturalism

- All laws depend on God.
- **Radical**: God *makes* them true and could have made them false. Could make "you're reading this" and "you're not reading this" both true. So the laws are contingent. (Descartes held something like this.)
- **Moderate**: the laws express God's perfect **nature**. God's nature is necessary, so the laws are necessary. He builds them into our minds, which is why they seem self-evident on reflection.
- Objections Gensler lists:
    1. The laws hold in every possible world, including godless ones, so God can't be the basis.
    2. We're more certain of logic than of God, so it's backwards to base logic on God.
    3. Euthyphro-style: God accepts them because they're valid; they're not valid because He accepts them or because they match His nature.

### 3.2 Psychologism

- Laws are based on how we think. Evolution built logic into us.
- **Radical**: logic *describes* how we think. Objection: then nobody could ever reason badly. People do.
- **Moderate**: logic is built in as instinctive *norms*. We feel "cognitive dissonance" at inconsistency.
- Objections:
    - An instinct being there doesn't make it *right*. Evolution could have given us an instinct that the earth is flat.
    - **Circular**: we need logic to assess the theory of evolution, so our knowledge of logic can't rest on it.
    - We're surer of logic than of any scientific theory.

### 3.3 Pragmatism

- Laws are based on experience. Logic *works*.
- Objections:
    - It works *because* the laws hold necessarily. Experience can show that something is so, never that it **must** be so. A mousetrap might fail. Modus ponens can't.
    - **Circular**: knowing that logic works takes observation plus reasoning, and the reasoning uses logic.

### 3.4 Conventionalism

- Laws are true by the meaning of "and", "or", "not", "if". The truth tables define the words, and then you can check that modus ponens never goes from truth to falsehood.
- Attractions: explains necessity (deny the law and you contradict the meaning of the words), explains a priori knowledge (like "bachelors are unmarried"), needs no God, evolution, Platonic heaven or special faculty. Opens the door to alternative logics with other conventions.
- Objections:
    - **Circular**: the proof runs "If the truth table never gives true premises and false conclusion, modus ponens is valid. The table never does. ∴ Modus ponens is valid." That *is* modus ponens.
    - Confuses the **laws** with how we **express** them. Change the language and you'd express the same laws differently.
    - Makes the laws arbitrary. On some many-valued conventions modus ponens and non-contradiction fail. But the laws seem correct whatever we decide.

### 3.5 Realism

- Laws are objective, independent, abstract truths. We discover them. Not reducible to minds (ours "or even God's"), matter, usefulness or convention. They hold in every possible world because violations are impossible.
- Known by trained intuition: a law is well supported when it seems evident to a mind practised in logic and attempts to find objections keep failing. Not infallible.
- Objections:
    - **Too mysterious.** What *are* these facts? Not made of chemicals. How does a physical brain get to know them?
    - Needs abstract entities (sec. 1), which have no home in a materialist picture. A mind-and-matter dualist has the same problem.

### Scorecard

| View | Explains necessity? | Avoids circularity? | Main problem |
|---|---|---|---|
| Radical supernaturalism | no | | laws become contingent |
| Moderate supernaturalism | yes | | the three objections above |
| Psychologism | no | no | instinct ≠ correct |
| Pragmatism | no | no | "works" ≠ "must" |
| Conventionalism | sort of | no | arbitrary |
| Realism | yes | yes | what and where are these truths? |

Three of the five fail the same way: they try to justify logic by something (evolution, experience, definitions) that you can only establish by using logic. Worth noticing that this is the structure of a transcendental argument, and Gensler isn't an apologist.

## 4. Truth and the Liar

- What has truth values? Sentences? Sentences-as-used? Propositions (and what are those)?
- Theories of truth: correspondence, coherence, pragmatist, verification, ideal consensus, redundancy.
- Link back to [[Deviant Logics]]: pragmatist and verification theories force you to give up excluded middle (plenty of statements are neither useful nor verified, and neither are their negations).
- **Tarski's Convention T**: "Snow is white" is true if and only if snow is white. Any definition of truth has to respect this.
    - Kills "true = accepted in our culture": on an island where nobody believes in snow, snow would be white and "snow is white" not true. Absurd. Same for "true = verified" and "true = useful".
- **Liar paradox**: (P) P is false. If true then false, if false then true.
    - Priest: it's both. (Give up non-contradiction.)
    - Usual view: it's neither. (Qualify excluded middle.) But why?
    - Russell's **theory of types**: no statement can talk about itself. Problem: that rule talks about all statements including itself.
    - Tarski: no language contains its own truth predicate; you need a **metalanguage**. Problem: English obviously does contain "true".
    - No agreed solution.
- Goes back to Epimenides the Cretan ("Cretans always lie"), and Gensler notes St. Paul quotes it: Titus 1:12.

## 5. What Counts as Logic?

- Narrow: deductive logic only. Broad: also informal, inductive, metalogic, philosophy of logic.
- Quine wanted "logic" to be just classical propositional + quantificational. Modal and deontic are philosophy, set theory is maths, deviant logics are illegitimate.
- Most people now are looser. No sharp edge.

## 6. The Orthodox Angle

*Mine, not Gensler's.*

- **Radical supernaturalism isn't the Christian view.** God doesn't decree logic and couldn't have decreed otherwise. "He cannot deny himself" (2 Tim 2:13). That's voluntarism, the same mistake as horn 1 of [[The Euthyphro Dilemma and the Orthodox Answer]].
- **Moderate supernaturalism is close**, and the three objections can be answered, I think:
    1. *"Holds in godless worlds."* Begs the question. If God is a necessary being there are no godless possible worlds. The objection assumes He's contingent.
    2. *"Logic is more certain than God."* Mixes up order of knowing and order of being. I can be surer that water is wet than of any chemistry and it's still H₂O that makes it wet. What we know first isn't what's first.
    3. *"God accepts them because they're valid."* That's the Euthyphro, and the answer is the same: the standard isn't above God or below His will. It's what He is.
- **Realism's weak spot is exactly what theism supplies.** Realism says the laws are necessary, immaterial, universal, and normative for minds, but can't say what they are or how minds reach them. Thoughts are the kind of thing that can be about something and true of everything, and a necessary mind is where necessary thoughts would be. Gensler's realist says the laws aren't reducible "even to how God thinks", but doesn't argue it.
- **Logos.** John 1:1: "In the beginning was the Logos." Reason, order, word. Woods and Irvine point out that for the Greeks *logos* meant both the rational order of the cosmos and the reasoning that finds it (see [[Aristotle's Early Logic and the Thirteen Fallacies]]). Christianity says that this Logos is a Person, and that we reason because we're made in His image. Creation is intelligible because made through Him. See [[The Logoi of Creation in St. Maximus]].
- **But careful with essence and energies.** I don't think Orthodoxy wants to say the law of non-contradiction *is* the divine essence. God's essence is beyond our concepts. Better: the order of reason is how the Logos is present to created minds, on the side of the energies. Apophatic language ("God is and is not being") isn't a breach of logic. It's marking that our predicates don't fit. See [[Deviant Logics]] sec. 3.
- **How this relates to TAG.** Sec. 3 basically hands over the materials: psychologism, pragmatism and conventionalism are all circular, realism is left with a mystery. What Gensler's survey *doesn't* do is show that theism is the only way out. A Platonist realist will say "abstract objects just exist". That step still has to be argued. See [[TAG]].

## 7. Still Open for Me

- Is "the laws are God's thoughts" (Augustine, and people like Plantinga and Welty now) the same as what Maximus means by logoi, or a more Western picture?
- Does the theistic answer cover deviant logics too, or does it assume classical logic is the right one?
- Read: Quine, *Philosophy of Logic*, and McGinn, *Logical Properties* (Gensler says to read them against each other).

## Related

- [[Deviant Logics]]
- [[Valid vs Sound Arguments]]
- [[The Classic Laws of Logic]]
- [[TAG]]
- [[TAG: Logic and Its Justification in Other World Views - A Refutation]]
- [[Transcendental Categories Are Required for Science and Knowledge]]
- [[The Problem of Universals: Realism vs Nominalism]]
- [[The Euthyphro Dilemma and the Orthodox Answer]]
- [[The Logoi of Creation in St. Maximus]]
- [[Would Aliens Have to Operate on Logic]]
- [[Critique of Empiricism]]
