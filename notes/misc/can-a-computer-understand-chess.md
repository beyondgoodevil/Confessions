---
id: M-0378
date: 2026-10-20
title: "Can a Computer Understand Chess? Turing, Searle, Dreyfus and Deep Blue"
tags: [philosophy, mind, chess]
summary: "Chess as the classic test case for artificial intelligence. Turing's imitation game and Searle's Chinese room (strong vs weak AI). Deep Blue vs Kasparov (1996–97) and the final game's 8.Nxe6. Then four positions from Philosophy Looks at Chess: Miah (chess is 'too easy', the wrong game, since a machine doesn't know it is playing; Suits's definition of a game), Coutts (a chess Chinese room: the systems reply works for chess, so computers understand chess without beliefs or desires), Dreyfus as reported by Selinger (grandmasters see, they don't calculate; the skill model; Kaplan adding numbers while playing) and Selinger's embodiment critique (Bergman's Seventh Seal; bodies marked by age, sex, culture), Hartmann (Heidegger's enframing, ChessBase, 'Kasparov is a cyborg'). AlphaZero and the engine era since. With a diagram, a comparison table and an Orthodox assessment (nous and dianoia, understanding as personal)."
source: "Benjamin Hale, ed., Philosophy Looks at Chess (Open Court, 2008), chs. 2 (Andy Miah, 'A Deep Blue Grasshopper: Playing Games with Artificial Intelligence'), 3 (Tama Coutts, 'Playing Chess in the Chinese Room'), 4 (John Hartmann, 'Garry Kasparov Is a Cyborg, or What ChessBase Teaches Us about Technology'), 5 (Evan Selinger, 'Chess-Playing Computers and Embodied Grandmasters: In What Ways Does the Difference Matter?'); web: Wikipedia, 'Deep Blue versus Kasparov, 1997, Game 6'; ChessBase and Chess.com reports on the AlphaZero Science paper (Dec 2018); Scripture KJV"
aliases: [Chess and Artificial Intelligence, Deep Blue, Chinese Room and Chess, Kasparov Is a Cyborg, Dreyfus on Chess, AlphaZero]
---

> "Eyes have they, but they see not: They have ears, but they hear not... They that make them are like unto them; so is every one that trusteth in them." (Psalm 115:5–6, 8)

> "But there is a spirit in man: and the inspiration of the Almighty giveth them understanding." (Job 32:8)

> "Thou hast made him a little lower than the angels... thou madest him to have dominion over the works of thy hands." (Psalm 8:5–6)

For fifty years **chess was the test** for machine intelligence. It was a game of perfect information, demanding enough that only "great minds" played it well, and closed enough that a machine could in principle play it perfectly. Then in 1997 IBM's **Deep Blue** beat world champion **Garry Kasparov**, and the question changed. A machine can obviously *play* chess better than any human. Does it **understand** chess? And if it does, what does that tell us about understanding? The essays in *Philosophy Looks at Chess* give four different answers. Here's how it works:

## 1. The Background: Turing and Searle

**Turing (1950), the imitation game.** If a machine, conversing by text, can fool a human judge into thinking it's human, we have no grounds to deny it intelligence. "After all, our only way of interacting with other humans is through language", as Miah summarises. Turing himself wrote one of the first chess programs, though there was no computer to run it.

**Searle (1980), the Chinese room.** A person who speaks only English sits in a room with books of rules. Chinese characters come in through a slot. The person looks them up and copies out the characters the rules specify, and sensible Chinese answers go back out. To the people outside, the room "speaks Chinese". The person inside understands none of it.
- **Lesson:** running a program (manipulating symbols by syntax) isn't sufficient for understanding (semantics). There must be more to a mind than "instantiating the right program".
- **Strong AI** (Searle's target): the right program is a mind, and human minds are programs running on biological hardware. **Weak AI**: computers are useful tools for *studying* minds by simulating them. (Coutts's definitions are the standard ones; Miah's are muddled.)

**Two classic replies**
1. **Systems reply.** The person doesn't understand Chinese, but the *whole system* (room, books and person) does. Searle answers: let the person memorise the books. Now there's no system apart from her, and she still doesn't understand.
2. **Robot reply.** Put the room inside a robot with cameras, microphones and arms, so the symbols are hooked up to the world. Searle answers: that concedes that symbol manipulation isn't enough, and the robot still lacks **intentionality** (its states aren't "about" anything).

## 2. Deep Blue vs Kasparov

- **1996:** Kasparov won the first match 4–2. **1997 rematch:** Deep Blue won 3½–2½. As Moravec puts it (quoted by Miah), Kasparov won the long first game, lost the second to "masterly moves by the machine", drew three, and then in the last game "a visibly shaken and angry Kasparov resigned early". It was the first match he had ever lost.
- **How it played.** Deep Blue searched by brute force plus selective extensions. Selinger quotes the figure of **sixty billion positions** in the three minutes allowed per move, against perhaps **three positions a second** for a grandmaster. Its evaluation function had been tuned with grandmasters' help.
- **Kasparov's reaction.** He reported "signs of a mind in the machine" and suspected humans behind the scenes feeding it ideas. Miah calls this "an accidental Turing test admission".

![[deep-blue-kasparov-1997-g6.svg|360]]

*Game 6, 1997: 1.e4 c6 2.d4 d5 3.Nc3 dxe4 4.Nxe4 Nd7 5.Ng5 Ngf6 6.Bd3 e6 7.N1f3 h6? 8.Nxe6! The knight sacrifice hits the queen and g7, and the black king is stuck in the centre. Kasparov resigned after 19 moves.*

- **The irony.** 8.Nxe6 is well-known opening theory, and Deep Blue had it **in its opening book**. Kasparov's 7...h6 was either a mix-up of move order (the usual line is 7...Bd6 and 8...h6, which he had played himself) or, as Deep Blue's architect Feng-hsiung Hsu suggested, a deliberate "anti-computer" try. Either way, the decisive moment of "man vs machine" was a human-prepared line beating a human mistake.

## 3. Miah: Chess Is the Wrong Game

Andy Miah, "A Deep Blue Grasshopper".
- **Chess is "too easy"** (Selmer Bringsjord's phrase). It's a closed system of perfect information. Beating a human at it shows one narrow, calculative capacity, not general intelligence. Even Deep Blue's makers "claim no level of intelligence within the machine".
- **Deep Blue doesn't play a game.** It "does not know it is playing a game", so it can't be strategic in the human sense. AI research has neglected "what it means to play a game".
- **Suits's definition.** Playing a game is "the voluntary attempt to overcome unnecessary obstacles": accepting rules that rule out the efficient means *because* they make the activity possible (the **lusory attitude**). A machine follows rules but doesn't *accept* them.
- **Better tests.** He suggests games like **soccer**, which mix closed decisions with "open", split-second, embodied ones, or Bringsjord's "storytelling" test. Deep Blue's flaw, he says, is "an inability to know when to break the rule".
- *My note:* Miah's description of how Deep Blue works ("it must analyze every possible move") is a simplification. It prunes heavily.

## 4. Coutts: Computers Do Understand Chess

Tama Coutts, "Playing Chess in the Chinese Room".
- **The chess Chinese room.** Sally, who knows nothing of chess, gets positions through the slot and follows rules to write out moves in algebraic notation, legal and mostly good. Meanwhile she plays draughts, which she does understand, against someone else.
- **The systems reply works here.** In the language case, memorising the rules gives Sally an "English subsystem" and a "Chinese subsystem" so different that the second can't explain the first. But her chess subsystem (grinding through millions of positions) and her draughts subsystem (picking a few promising moves and analysing them) differ only in *degree*. "It doesn't even seem obvious that there is a deep difference between the subsystems."
- **His conclusion:** "the very machine on your desk should be considered to understand chess in a way not importantly different from a person". The price is the "unargued suggestion" that a thing can have **understanding without beliefs, desires or intentionality**. The computer doesn't *believe* it's playing chess; it just understands chess.
- **On language** he weakly defends the robot reply. If we found a tiny rule-following person inside every neuron of a speaker's head, we wouldn't stop saying the speaker has a mind.

## 5. Dreyfus: Grandmasters See, They Don't Calculate

Hubert Dreyfus (*What Computers Can't Do*), as presented and criticised by Selinger.
- After Kasparov lost, Dreyfus said that "in a world in which relevance and intelligence play a crucial role and meaning in concrete situations, the computer has always behaved miserably", and that one victory won't change that.
- **Experts don't deliberate.** Grandmasters "simply perceive the patterns that the chess pieces form as meaningful images and respond accordingly". He guesses they can "directly discriminate perhaps hundreds of thousands of types of whole positions". Rule-following is for novices. Experts act from **intuition** and **flow**, like athletes "in the zone".
- **Evidence.** **Lightning chess**: grandmasters move in under a second and still play master-level games. And the **Kaplan experiment**: International Master Julio Kaplan added numbers at about one a second while playing five-seconds-a-move chess against a slightly weaker master, "and more than held his own".
- **Calculation can even hold you back.** Stuart Dreyfus (Hubert's brother, a mathematician) "never got beyond the competent level". "A truck driver is as likely as a mathematician to be among the world's best players."
- So humans and computers play chess in **different ways**. Deep Blue's win shows that brute calculation can beat expert perception in a closed domain, not that it *is* expertise.

## 6. Selinger: Bodies, Bergman and Prejudice

Evan Selinger, "Chess-Playing Computers and Embodied Grandmasters".
- **Bergman's *Seventh Seal*.** A knight back from the Crusades plays chess with Death for his life. Chess becomes "a symbolic confrontation with the meaning of finitude". Only a being that experiences past, present and future, and its own death, plays in that sense. Things are "world poor", and animals perish rather than die (Heidegger).
- **His critique of Dreyfus.** For all his talk of **embodiment**, Dreyfus's evidence is about *brains* (hemispheres, neural nets), and he even calls Kasparov a "disembodied mind". He treats the expert body as having "no relevant biography, gender, race, or age", always in the zone.
- **Real players are marked bodies.** They perceive their opponents as old, young, male, female, nervous or confident, and that affects their play, sometimes through prejudice (he cites Jennifer Shahade on women in chess). Eros and prejudice are "hallmarks of human disposition". Computers don't play like humans, partly because they're not influenced by any of this.

## 7. Hartmann: Kasparov Is a Cyborg

John Hartmann, "Garry Kasparov Is a Cyborg".
- **Dreyfus reifies the machine.** Deep Blue didn't "spring full-grown from the head" of its designer. It was built and tuned by people. And the more important technology isn't Deep Blue (fourteen games against Kasparov in its whole career) but **ChessBase** and engines like **Fritz**, which Kasparov used every day for nearly twenty years. Kasparov called ChessBase "the most important development in chess since the printing press".
- **Heidegger's worry.** Modern technology "enframes" (*Gestell*) everything as raw material. Hartmann sees it in kibitzers pasting engine lines instead of thinking and in owners crowing about "their" engine's rating.
- **But technology can also be used well.** He follows master Tim Mirabile preparing for a grandmaster with ChessBase and Fritz: finding his opponent's narrow repertoire, checking an old game, and finding a novelty that neither the engine nor the human would have found alone. Jennifer Shahade: "Much of using Fritz well is knowing when to turn it off."
- **The thesis.** Such players are **cyborgs** in Donna Haraway's sense: hybrids of human and machine, the way a blind person "sees" through a cane (Don Ihde). Kasparov, "trained" by Fritz from about 1994, was "the first chess cyborg". So who won in 1997? Both sides were "tangled webs of humans and nonhumans".

## 8. Since Then: The Engine Era

- **AlphaZero (DeepMind).** Given only the rules, it learned chess by playing itself. After about four hours of training it was estimated to be stronger than Stockfish 8. In the match reported in *Science* (Dec 2018) it beat Stockfish **+155 −6 =839** in 1,000 games. Grandmasters were struck by how human its style looked: long-term sacrifices for activity, pawn storms, positional intuition. Dreyfus's line between "calculating machine" and "pattern-perceiving expert" became blurred: a neural network *does* perceive patterns, in some sense.
- **Engines now far surpass humans**, and every serious player trains with them. Hartmann's cyborg is now the norm. Kasparov himself promoted "advanced chess", humans and engines playing together.

## 9. The Positions at a Glance

| | Does the computer understand chess? | Key reason |
|---|---|---|
| **Searle** (implied) | No | Symbol manipulation isn't understanding; no intentionality |
| **Miah** | No, and chess is the wrong test | It doesn't know it's playing a game; chess is "too easy" |
| **Coutts** | Yes, in a limited sense | Systems reply: chess needs no beliefs or desires; human and machine differ only in degree |
| **Dreyfus** | No; it plays differently | Experts perceive and intuit; machines calculate |
| **Selinger** | Not as humans do | Human play is embodied, temporal, marked by culture and desire |
| **Hartmann** | Wrong question | The real unit is the human–machine hybrid |

## 10. Assessment

*Mine.*

**Where the debate is right**
- **Coutts's narrowing is honest.** If "understanding chess" means "reliably producing good moves for good reasons encoded in the evaluation", then engines understand chess, and better than we do. AlphaZero makes this hard to deny. But notice what he has to give up to say it: no beliefs, no desires, no intentionality, no knowing that it's a game. "Understanding" has been redefined as *competence*. That's a real result: competence and understanding can come apart.
- **Dreyfus is right about what grandmasters do**, and the Fathers would recognise it. They distinguish **dianoia** (discursive reasoning, step by step) from **nous** (the intellect's direct grasp). The grandmaster who "sees" the right move is a small, natural image of the difference. Calculation is how you check a vision, not where the vision comes from. See [[Nous]].

**Where it goes wrong**
- **Understanding belongs to persons.** The Christian answer to "does the system understand?" is that *understanding is an act of a person* (a *hypostasis*), not a property of a mechanism, however good. Natures have powers. Persons use them, know that they know, and know *whom* they're playing. Hartmann's "network of actors" erases exactly this. A network can't repent of 7...h6, fear the clock or be gracious in defeat. See [[Action Is Not Proper to the Person]] and [[Mind and Body: Dualism, Materialism, Emergence]].
- **Selinger and Bergman have the deepest point.** Chess matters to humans because we play it as **mortal** beings, with time, a body, and a death we can think about. The knight plays Death to buy time to find God. A machine has nothing at stake and nothing to lose. Miah's "it doesn't know it's playing a game" is the small version of this.
- **The idol warning.** "Eyes have they, but they see not... They that make them are like unto them" (Ps 115). The danger isn't that engines understand too much. It's that we start to imitate them: kibitzers who stop thinking, players who become extensions of their tools (Heidegger's *Gestell*), and a culture that measures minds by output. Shahade's rule is a good one for every technology: *much of using it well is knowing when to turn it off.*
- **What survives.** Machines now play better chess than any human ever will, and people still play. That's the best evidence that chess was never only about the best move. It's an activity of persons: Suits's voluntary acceptance of unnecessary obstacles, for the joy of it. "There is a spirit in man" (Job 32:8), and the game exists *for* that spirit.

## Related

- [[Nous]]
- [[Action Is Not Proper to the Person]]
- [[Mind and Body: Dualism, Materialism, Emergence]]
- [[The Argument from Reason]]
- [[Descartes: The Cogito and Mind-Body Dualism]]
- [[Heidegger and the God Beyond Being]]
- [[Chess Tactics and Opening Traps: Pins, Forks and Discoveries]]
- [[The Mathematics of Chess: Zermelo, Shannon, Eight Queens and the Knight's Tour]]
- [[Bobby Fischer's Checkmate Patterns: Back-Rank Mates, Displacing Defenders and Pawn Cover]]
