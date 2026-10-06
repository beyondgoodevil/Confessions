---
id: B-0011
date: 2026-10-07
title: "Aristotle's Early Logic and the Thirteen Fallacies"
tags: [philosophy, logic, fallacies]
summary: Aristotle's logic before the Prior Analytics. Why he invented it, what a syllogism is in the broad sense, how a refutation works, where "ad hominem" really comes from, and the original list of thirteen fallacies from On Sophistical Refutations.
author: John Woods and Andrew Irvine
source: "Handbook of the History of Logic, vol. 1, eds. Gabbay and Woods (Elsevier, 2004), pp. 27–99"
---

The usual line is that Aristotle's logic starts with the *Prior Analytics* (the figures and moods), and that the *Topics* and *Sophistical Refutations* are "only dialectic". Woods and Irvine think there is a real logic already in the earlier books. Long chapter, and I read the sections on motivation, the broad syllogism, refutation and the fallacies properly and skimmed the technical middle.

Background is in [[Logic Before Aristotle]].

## 1. The Organon

Probable order of writing (they follow others here, and admit nobody is sure):

| Work | About |
|---|---|
| *Categories* | kinds of predicate / kinds of being |
| *On Interpretation* | statements, affirmation and denial, opposition |
| *Topics* I–VII | strategies for arguing either side of a question |
| *Posterior Analytics* I | demonstration, scientific knowledge |
| *Topics* VIII, *Sophistical Refutations* | conducting and exposing arguments |
| *Prior Analytics*, *Posterior Analytics* II | the formal syllogistic |

- "Topic" (*topos*) = a strategy or scheme of argument. Not "subject matter".
- *Sophistical Refutations* may just be the last book of the *Topics*.
- Modus ponens and modus tollens are already recognised in the *Topics*.

## 2. Why Invent Logic?

- *Logos* had "run amok" with Heraclitus, Parmenides and the Sophists, mostly through mishandled **ambiguity** and puzzles about **change**. It threatened science and common sense both.
- Aristotle's question: **how can logos be made to behave?**
- That's why the Organon *starts* with two books that don't look like logic. *Categories* and *On Interpretation* are sorting out change and ambiguity first.
- His big idea: there's one model of correct argument that works for **any** subject. The syllogism.
- Nice point: this actually vindicates the Sophists' central claim, that there are ways of arguing correctly about anything, while taking it away from them.
- Also why it was a philosopher who invented logic and not a general or a doctor: only philosophy had been wrecked by bad arguments badly enough to need it.

## 3. The Syllogism in the Broad Sense

Definition (*Soph. Ref.* 165a; nearly the same in *Topics* and *Prior Analytics*):

> a deduction "rests on certain statements such that they involve necessarily the assertion of something **other** than what has been stated, **through** what has been stated."

So a syllogism here is not yet "two premises, three terms, a figure". It's a valid argument that meets extra conditions:

| Condition | Rules out |
|---|---|
| Conclusion follows of necessity | invalid arguments |
| Conclusion is **other than** any premise | circular arguments (begging the question) |
| Follows **through** the premises, all of them | idle / irrelevant premises |
| More than one premise ("certain statements") | one-step immediate inferences |
| Every line is a **proposition**: one thing said of one thing | compound statements, double questions |

Consequences I hadn't appreciated:

- **Valid ≠ syllogism.** Every syllogism is valid but lots of valid arguments aren't syllogisms. "P, therefore P" is valid and useless. "P, Q, R ∴ S" where R does no work is valid but not a syllogism.
- So Aristotle's validity is plausibly the same as ours. The extra conditions are what make an argument *worth giving*.
- No idle premises, and premises consistent, means his syllogistic doesn't have explosion and is a kind of **relevance logic** before the name. Woods and Irvine make a lot of this. Compare [[Deviant Logics]] sec. 5.
- It also explains why several "fallacies" below aren't invalid arguments at all.

Compare the modern split in [[Valid vs Sound Arguments]]: validity alone was never the whole of a good argument.

## 4. Refutation

How the game works (developed from Socratic **elenchus**; the abused version is the **eristic** of Plato's *Euthydemus*):

1. **Answerer** puts up a thesis T.
2. **Questioner** asks yes/no questions.
3. The answers become premises.
4. If the questioner can build a *syllogism* from those answers to **not-T**, T is refuted.

- So a refutation = a syllogism whose premises are the other man's own concessions and whose conclusion contradicts his thesis.
- A refutation of T **isn't a proof that T is false**. It shows the answerer's commitments are inconsistent. One of them has to go, not necessarily T.
- "Begging the question" is literal here: the questioner *asks for* (begs) the very point at issue as one of his premises.

## 5. Where "Ad Hominem" Comes From

- The phrase is usually credited to Locke. Locke said he didn't invent it. Woods and Irvine trace it to **Aristotle** (*Metaphysics* Gamma 4, K 5): about first principles "there is no proof simply, but against a particular person there is".
- Original meaning: arguing **from what this person concedes**. Proof relative to the man (*pros ton anthrōpon*), not proof outright.
- That is not a fallacy. It's exactly what a refutation is.
- It's how Aristotle defends the **law of non-contradiction**. You can't prove it from anything more basic. But get the denier to say something meaningful and he has already relied on it. "Proof by way of refutation."
- The modern sense (attacking the person instead of the argument) is a different thing that took over the name. See [[The Ad Hominem Fallacy]].

That defence of non-contradiction is a transcendental argument in everything but name. See [[TAG]] and [[The Classic Laws of Logic]].

## 6. What a Fallacy Is

- Broadly: something that **looks like** an argument of a certain kind and isn't.
- In *Soph. Ref.*: looks like a syllogism (so looks like a refutation) and isn't. A *paralogismos*.
- So "fallacy" is defined against the broad syllogism of sec. 3, not against bare validity.
- Aristotle gives 64 worked examples and alludes to about 55 more.
- Why study them (*Soph. Ref.* 16): (i) most depend on language, so they teach you how many ways a word is used; (ii) if someone else can fool you, you'll fool yourself; (iii) reputation: you look incompetent if you can sense an argument is bad and can't say why.
- Woods and Irvine's complaint: for all that, his treatment is "thin and fragmentary". No fallacy gets a full theory. Their guess is that he later thought he didn't need one, because the *Prior Analytics* shows how any real syllogism can be *shown* to be one (the "perfectibility" result).

## 7. The Thirteen

Two groups. Medieval labels: ***in dictione*** (dependent on language) and ***extra dictionem*** (outside language).

### Dependent on language (6)

| # | Name | What goes wrong | Example |
|---|---|---|---|
| 1 | **Equivocation** | one word, two meanings | The end of life is death. Happiness is the end of life. ∴ Happiness is death. |
| 2 | **Amphiboly** | the *grammar* is ambiguous | Visiting relatives can be boring. Oscar is a visiting relative. ∴ Oscar can be boring. |
| 3 | **Combination** | words taken together that should be apart | "Socrates can walk while sitting" (= can walk-and-sit at once: false) |
| 4 | **Division** | words taken apart that should be together | same sentence the other way (= while sitting, has the power to walk: true) |
| 5 | **Accent** | meaning shifts with pronunciation / accent mark | his example is an emended line of Homer |
| 6 | **Form of expression** | similar-looking words treated as the same kind | "flourishing" looks like "cutting" but one is a state, the other an action |

- Equivocation rewritten without the ambiguity has **four terms**, so it's not a syllogism.
- Modern "composition and division" (every player is excellent ∴ the team is excellent) is a *different* fallacy about parts and wholes that inherited the names of 3 and 4.
- Hamblin's example for 6: J. S. Mill arguing that "desirable" works like "visible" and "audible" (what people do see / hear / desire). But desirable means *worthy* of desire.

### Outside language (7)

| # | Name | What goes wrong | Modern descendant |
|---|---|---|---|
| 7 | **Accident** | treating what's true of a thing as true of its attribute, or mixing the "is" of predication with the "is" of identity | (obscure; the modern "accident" is different) |
| 8 | ***Secundum quid*** | dropping a qualification: true "in a certain respect" taken as true without qualification | hasty generalisation |
| 9 | ***Ignoratio elenchi*** | "ignorance of refutation": proving something other than the contradictory of the thesis | missing the point, straw man, red herring |
| 10 | **Consequent** | thinking an if-then converts | affirming the consequent |
| 11 | **Non-cause as cause** | a premise that does no work is blamed for the absurd result | (in the *Rhetoric*: *post hoc ergo propter hoc*) |
| 12 | **Begging the question** | assuming what's to be proved | circular reasoning |
| 13 | **Many questions** | two questions asked as one | loaded / complex question |

Notes:

- **7, accident.** His example: Coriscus is different from Socrates; Socrates is a man; ∴ Coriscus is different from a man. Fails because "Socrates is a man" is predication, not identity.
- **8.** "The Ethiopian is white in respect of his teeth ∴ the Ethiopian is white."
- **9** is in a way the master fallacy. Aristotle says all the others can be reduced to not knowing what a refutation is.
- **10.** Also covers converting "all S are P" to "all P are S". See [[Propositional Logic Cheat Sheet]] sec. 5.
- **11** is not really about causes. Premises are the "causes" (reasons) of a conclusion. If a reductio derives something absurd, you can only blame premises that were actually used.
- **12.** Five ways to do it (*Topics* VIII 13). The sneaky ones use a synonym, or an equivalent statement, so the premise doesn't *look* like the conclusion. NB it's a fault in the broad-syllogism sense (conclusion not "other"), not in validity. See [[The Fallacy of Circular Reasoning]], [[A Circular Argument]].
- **13.** "Have you stopped beating your father?" Breaks the one-thing-of-one-thing rule, so the "premise" isn't a proposition.

### Sorted by what they violate

| Violates | Fallacies |
|---|---|
| validity | 1–6 (once disambiguated), 7, 8, 10 |
| "conclusion other than premises" | 12 |
| "through the premises" (relevance) | 11 |
| "one thing of one thing" | 13 |
| contradicting *the thesis* | 9 |

Only about half are invalid in the modern sense. The others are valid arguments that fail to be syllogisms or fail to be refutations.

## 8. What's Not on the List

- No ad hominem (abusive), appeal to authority, appeal to the people, appeal to force, straw man by name, slippery slope. Most of the "ad" fallacies come much later (Locke, then 19th-century textbooks).
- So the fallacy notes already here split into Aristotle's and later ones:
    - Aristotle's: [[The Fallacy of Circular Reasoning]], [[Hasty Generalization Fallacy]] (≈ 8), [[The Appeal to Irrelevance Fallacy]] (≈ 9), [[Word-Concept Fallacy: Biblical Examples]] (a cousin of 1)
    - Later: [[The Ad Hominem Fallacy]], [[Tu Quoque Fallacy]], [[The Consensus Fallacy]], [[Moving the Goalpost]], [[Double Standard Fallacy]]

## 9. Questions

- Hintikka's view (which they quote without fully agreeing): the fallacies aren't bad *inferences* at all but breaches of the rules of a questioning game. Seems right for 12 and 13, less so for 10.
- If Aristotle's syllogism has relevance and non-circularity built in, did the move to modern "validity" lose something? The modern list of informal fallacies looks like an attempt to put it back.
- The skimmed middle sections (their formal reconstruction, the section on necessity) need a second go.

## Related

- [[Logic Before Aristotle]]
- [[Valid vs Sound Arguments]]
- [[Propositional Logic Cheat Sheet]]
- [[Deviant Logics]]
- [[Philosophy of Logic: What Grounds the Laws of Logic]]
- [[The Classic Laws of Logic]]
- [[The Fallacy of Circular Reasoning]]
- [[The Ad Hominem Fallacy]]
- [[Hasty Generalization Fallacy]]
- [[The Appeal to Irrelevance Fallacy]]
- [[TAG]]
