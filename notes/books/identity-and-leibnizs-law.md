---
id: B-0010
date: 2026-03-23
title: "Identity and Leibniz's Law"
tags: [philosophy, theology, metaphysics, trinity, christology]
summary: What identity is, Leibniz's law and the identity of indiscernibles, and three unorthodox proposals (relative identity, time-indexed identity, contingent identity). Hawthorne thinks the puzzles are never really about identity. Plus my notes on the Trinity and Christology.
author: John Hawthorne
source: "The Oxford Handbook of Metaphysics, eds. Loux and Zimmerman (OUP, 2003), ch. 4"
---

Identity = the relation everything has to itself and to nothing else. Hawthorne's thesis is stated in his first and last paragraphs: puzzles put in terms of "identity" are almost always puzzles about something else. One of his two opening examples of a puzzling identity claim is "there is something that was a man and is identical to God", so this is directly relevant. Technical chapter. I followed the main line and skipped a lot of the formal detail. Last section is mine.

## 1. Two Senses of "Same"

- **Numerical identity**: one and the same thing. The morning star *is* the evening star.
- **Qualitative identity**: exactly alike. Two copies of a book.
- All of this is about the first. (Hawthorne takes that for granted.)

## 2. Identity Is Basic

- "The relation each thing has to itself and to nothing else" isn't an analysis. "Itself" and "nothing else" already use the idea.
- Don't look for an analysis. It's too basic.
- You need it even when you never say "is identical to":
    - ∃x∃y(Fx ∧ Gy) vs ∃x(Fx ∧ Gx). The second says the F thing and the G thing are the *same*. Understanding a repeated variable is understanding identity. (Quine)
    - "Jim wounded a lion and Bill shot **it**" vs "...and Bill shot **another**". (Geach)

## 3. The Two Principles

| | Name | Says | Status |
|---|---|---|---|
| LL | **Leibniz's law** (indiscernibility of identicals) | if x = y, then whatever is true of x is true of y | uncontroversial |
| II | **Identity of indiscernibles** | if x and y have all the same properties, then x = y | depends what counts as a property |

- LL is the working tool. To show x ≠ y, find one thing true of x and not of y.
- II is **trivial** if "being identical to x" counts as a property (only x has that one).
- II gets interesting if you restrict properties:
    - only **sparse** properties (see [[The Problem of Universals: Realism vs Nominalism]] sec. 6)
    - only **non-haecceitistic** ones, i.e. none that mention a particular individual ("being identical to John", "being Jim's daughter")
- **Max Black's two spheres**: a universe with nothing in it but two exactly alike iron spheres five feet apart. Same size, same stuff, same relations. Aren't there still two? If so II (restricted) is false.
- Quine's distinction: the spheres are not **absolutely** discernible (no description fits just one) but they are **relatively** discernible ("x is five feet from y" holds between them, not between one and itself).

**"I-predicates."** Hawthorne's device: imagine a tribe whose language has a predicate "I" that is reflexive and obeys LL *for every predicate in that language*. Does "I" mean identity? Not necessarily. In a poor language (only "is a dog", "is happy") "I" would hold between any two happy dogs. You only pin down real identity by quantifying over *all* properties: x = y iff ∀F(Fx ↔ Fy). That's the standard second-order definition.

Upshot: identity is whatever relation obeys LL with no restrictions at all.

## 4. Unorthodox View 1: Relative Identity

**Geach.** There's no such thing as plain "same". Only "same F", for some sortal F.

His kind of case:

- A lump of clay that's a statue: call it George. Squash it. A new sculptor makes a new statue from the lump: Harry.
- (A) George is the **same lump** as Harry.
- (B) George is a **different statue** from Harry.
- If "same F as" meant "is an F and is identical to", A and B would contradict. So "same F" is basic and "Is George *the very same thing* as Harry?" has no sense.
- Counting goes relative too. How many? Depends: how many *what*.

Costs, according to Hawthorne:

- **Set theory.** A set is defined by having the same members. Absolute "same". So sets have to be rethought.
- **Reference and logic.** "Coreferring terms", "extensional context", how names and variables work, all presuppose plain identity.
- Geach's appeal to Frege ("how many?" needs a concept: one pack, or 52 cards?) doesn't get him there. Frege had no problem with absolute identity. Needing a concept in order to *count* isn't identity being relative.
- And the standard reply to the case: George and Harry are distinct statues, each *constituted by* one lump. Constitution isn't identity. No relative identity needed.

## 5. Unorthodox View 2: Identity at a Time

**Myro**, after Grice. Clay becomes Statue at t1, then Jug at t2.

- If "Clay is red" needs a time, why not "Clay = Statue"? At t1 Clay = Statue. At t2 Clay ≠ Statue, Clay = Jug.
- Not meant as a new kind of identity, only as ordinary identity that holds at times, like ordinary redness.
- Problem: LL. At t1, Clay has "will be a jug". Statue doesn't. So even at t1 they differ. Myro has to limit LL to properties that aren't "time-loaded", and then it's not clear the relation is identity.

## 6. Unorthodox View 3: Contingent Identity

- **Kripke**: identity is necessary. Proof in two lines: everything is necessarily self-identical; if x = y then by LL y has every property x has, including "being necessarily identical to x". So if x = y, then □(x = y).
- So "Hesperus = Phosphorus" is necessary, though discovered by observation.
- Contingent-identity people (**Lewis**, **Gibbard**) want "the statue = the clay, but might not have been".
- Hawthorne's point: the coherent versions **don't touch identity or LL**. They reinterpret the modal part:
    - Lewis: "x might have been F" means x has a **counterpart** in another world that is F. One thing can have two counterparts in one world. So "x = y but possibly x ≠ y" comes out true, with identity itself completely standard.
    - Gibbard: names inside modal contexts stand for *concepts* of things, not the things.

## 7. Hawthorne's Moral

> "Puzzles that are articulated using the word 'identity' are almost certainly puzzles about something else."

About constitution, or persistence, or modality, or what properties there are. Identity is clear and basic. Good views "exploit and not challenge" our grip on it.

## 8. Trinity and Christology

*Mine, not Hawthorne's.*

**The logical problem of the Trinity** is an identity problem on its face:

1. The Father is God.
2. The Son is God.
3. The Father is not the Son.
4. There is one God.

Read every "is" as identity and 1–3 contradict (identity is transitive).

Ways out, in Hawthorne's categories:

- **Relative identity** (Geach himself, van Inwagen): Father and Son are the *same God*, *different Persons*. No absolute question. Formally it works. Cost: everything in sec. 4. And it puts the mystery in logic, where the Fathers put it in God.
- **"Is" of predication, not identity.** "The Father is God" = the Father *is divine*, has the divine nature. Then 1–3 don't contradict, but why not three gods? The Cappadocian answer: one *ousia*, one will, one energy, and one source, the Father (**monarchy**). See [[Monarchical Trinitarianism]].
    - This is Hawthorne's moral applied: the puzzle "isn't about identity". It's about **nature and hypostasis**, i.e. about predication and what makes for one God.
    - It's also the "Socrates is a man" distinction that Aristotle's fallacy of accident turns on. See [[Aristotle's Early Logic and the Thirteen Fallacies]] sec. 7.
- **Constitution** analogies (statue and lump: one thing "numerically the same without identity"). Brower and Rea. Material analogies for God seem risky.

**Leibniz's law is how you prove real distinctions.**

- Father ≠ Son because the Father begets and the Son is begotten. One thing true of one and not the other.
- **Essence ≠ energies**: the energies are participated and known, the essence is not. LL gives a real distinction. The Thomist reply has to be that these predicates differ only "in our way of conceiving", which is to say LL doesn't apply to them. See [[Essence-Energies Distinction]].
- **Identity of indiscernibles**: the Persons share every property of the nature. What distinguishes them is only relations of origin (unbegotten, begotten, proceeding). Those are like Black's spheres: relatively, not absolutely, discernible. And they're "haecceitistic" in that they mention the other Persons. Makes me think the Filioque worry (if the Spirit's procession isn't distinct enough from the Son's begetting, what distinguishes them?) is at bottom an indiscernibility argument. See [[EO vs RC Trinity]].

**Christology.**

- "God died on the cross." "Mary is Mother of God." These are LL at work: Jesus = the Word, so what's true of Jesus is true of the Word. Nestorius in effect denied the identity. That's what Ephesus was about. See [[Council of Ephesus: Nestorianism]].
- But then: the Word is immortal, Jesus died, so by LL Jesus ≠ the Word? Chalcedon's answer is **qua**: mortal *according to* the human nature, immortal *according to* the divine. One subject (hypostasis), two natures, and predicates indexed to natures. See [[The Hypostatic Union]], [[Nature and Person Distinction in Christology]].
- Formally that's close to the time-indexing move in sec. 5 (red-at-t1, not-red-at-t2 isn't a contradiction; mortal-qua-human, immortal-qua-divine isn't either). Hawthorne would say: again not a puzzle about identity. The identity (Jesus = the Word) is strict. The work is done by a theory of how one subject has two natures.

So in both doctrines the dogmatic vocabulary (*ousia*, *hypostasis*, *physis*, "according to") is doing what Hawthorne says philosophers should do: leave identity alone and locate the difficulty somewhere else.

## 9. To Follow Up

- Is "qua" legitimate or a dodge? (Does "mortal qua human" just mean "has a mortal human nature"? Then is *He* mortal or not?)
- van Inwagen, "And Yet They Are Not Three Gods But One God", for the relative-identity Trinity.
- Lowe's chapter on **individuation** in the same volume: what makes a hypostasis *this* one.

## Related

- [[The Problem of Universals: Realism vs Nominalism]]
- [[Modal Logic: Necessity and Possibility]]
- [[Presentism vs Eternalism]]
- [[The Trinity]]
- [[Monarchical Trinitarianism]]
- [[The Hypostatic Union]]
- [[Nature and Person Distinction in Christology]]
- [[Essence-Energies Distinction]]
- [[Aristotle's Early Logic and the Thirteen Fallacies]]
- [[The Classic Laws of Logic]]
- [[Mind and Body: Dualism, Materialism, Emergence]]
