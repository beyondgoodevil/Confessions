---
id: M-0377
date: 2026-10-20
title: "Bobby Fischer's Checkmate Patterns: Back-Rank Mates, Displacing Defenders and Pawn Cover"
tags: [chess, checkmate-patterns, tactics]
summary: "Bobby Fischer Teaches Chess, a programmed-instruction course in mating combinations. Its method (frames, active answers, turning the page). Chapter by chapter: the elements of checkmate (three escapes from check, stalemate, pins as 'the seeds of many combinations', mating promotions), the back-rank mate (useful vs useless interpositions, counting 'power' at the mating square), back-rank defences (luft, safe recaptures, removing a defender, sideways back-rank mates), displacing defenders (drawing pieces or the king away) and sacrifices that break the pawn cover. Fischer's own examples from his games against Weinstein, Seidman, Bisguier, Pilnik and Sherwin. With diagrams and an assessment."
source: "Bobby Fischer, Stuart Margulies and Donn Mosenfelder, Bobby Fischer Teaches Chess (Bantam, 1972), 'A Word from Bobby Fischer', Introduction, chs. 1–5 and their summaries; game scores of Fischer–Bisguier and Fischer–Sherwin (US Ch 1957/58), Seidman–Fischer (US Ch 1957/58), Fischer–Weinstein and Fischer–Seidman (US Ch 1960/61) and Fischer–Pilnik (Santiago 1959) from chessgames.com; the other boards are illustrative positions built for this note; Scripture KJV"
aliases: [Bobby Fischer Teaches Chess, Back-Rank Mate, Checkmate Patterns, Programmed Instruction, Luft]
---

> "Whoso diggeth a pit shall fall therein." (Proverbs 26:27)

> "Let not him that girdeth on his harness boast himself as he that putteth it off." (1 Kings 20:11)

> "Watch ye, stand fast in the faith, quit you like men, be strong." (1 Corinthians 16:13)

*Bobby Fischer Teaches Chess* (1972, written with two experts in programmed instruction, Stuart Margulies and Donn Mosenfelder) teaches one thing: **how to see mating combinations**. Fischer's reason: "Since checkmating is the object of the game, I think it is the most basic thing to learn. The checkmate is the 'knockout' of Chess." The book drills a small number of **patterns** (the back-rank mate and its defences, displacing defenders, sacrifices against the pawn cover) until you recognise them "sometimes in just a few seconds".

The boards for Fischer's own games use the real game scores (from chessgames.com), with the positions he discusses in the book. The other boards are clean positions I built to show each pattern. Every board is interactive: step through the moves, or switch on the 3D view.

## 1. The Method: Programmed Instruction

- **Frames.** The book is a "program" of small steps called frames. Each shows a position and asks you to *do* something: tick yes or no, write a sentence, or (usually) draw an arrow showing the move. The answer is on the next right-hand page. When you reach the end, you turn the book round and work back through the other pages.
- **Why.** "Ordinarily, Chess books place you in a passive role... My book presents material as a tutor would and requires you to actively use the new ideas immediately by answering questions."
- **Background.** Programmed instruction came out of the behaviourist learning research of the 1950s (B. F. Skinner's "teaching machines"): small steps, an active response, immediate feedback. Margulies and Mosenfelder were professionals in the field. The book's front matter says their Effective Listening course was once voted the outstanding programmed course in the country.
- **Each frame builds on the last**, and nothing is asked that hasn't been taught. You don't need a board: "only this book and a few minutes to spare now and then".

## 2. The Elements of Checkmate (Chapter 1)

**Three ways out of check.** When the king is checked it must escape by:
1. **Capturing** the checking piece (with the king only if the piece is unprotected).
2. **Interposing** a piece between the checker and the king.
3. **Fleeing** to a square that isn't attacked.

If none of these works, it's **checkmate**. If the king *isn't* in check but there's no legal move at all, it's **stalemate**, a draw.

**What the chapter trains you to see**
- **Watch every defender.** Many frames look like mate but aren't, because some far-off piece can capture or interpose. "You have to watch all of the pieces on the board."
- **Pins.** A pinned piece can't come to the rescue. Fischer: "Whenever a piece is pinned to the King, it loses most of its powers. Always examine pins carefully because they are the seeds of many combinations." One frame shows a mate where Black's queen, bishop and knight are *all* pinned.
- **The king helps.** "One King can help trap the other." In endings the king is "a very valuable offensive piece", taking flight squares while a rook or queen checks.
- **Many checks, one mate.** Several frames offer three or four tempting checks of which only one mates. Choose the check that leaves no flight square.
- **Discovered check.** A rook moves and uncovers a check from the piece behind it, and the rook's move can cut off the king's flight squares at the same time.
- **Mating promotions.** Usually promote to a queen, "on rare occasions, however, promoting to a weaker piece [e.g., Knight] is a better play", for instance when only a knight's check mates. See [[Elementary Chess Endgames: Mating the Lone King, Opposition and Underpromotion]].

## 3. The Back-Rank Mate (Chapter 2)

"The most common of all mating combinations": mate on the first or last rank, where the king is shut in by its own pawns.

```chess
fen: 6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1
caption: The basic back-rank mate. The pawns meant to shelter the king leave it no flight square.
1.Re8#
```

**Useful vs useless interpositions.** When the checking rook is supported, putting a piece in the way is useless: it's just taken with check and the mate goes on. A **useful** interposition is one onto a square the defender also controls, so that the capture can be recaptured.

**Counting "power".** Fischer's key test: does White have **enough power** to mate on the back rank? Count the attackers of the mating square against the defenders of it.
- "White has the power to mate—four against three." Then the combination works: White captures, Black recaptures, and White's last piece mates.
- "Two against two": no mate.
- **Only pieces that give check when they land count.** A bishop or knight that attacks the back-rank square but doesn't give check from it "don't really" count for this combination.
- A pawn about to promote counts, since it lands as a queen.

```chess
fen: 2rr2k1/5ppp/8/8/3Q4/8/5PPP/3R2K1 w - - 0 1
caption: Counting power on d8: White attacks it twice (queen and rook), Black defends it once (the c8-rook; the d8-rook is the target).
start: 0
{Two against one. [%cal Rd4d8,Bc8d8]} 1.Qxd8+! Rxd8 2.Rxd8#
```

**Fischer's examples**
- **Fischer vs Bisguier (US Championship 1957/58, New York).** Should White take Black's queen? No: Black would recapture with his rook, *giving check*, and force mate, since White would have "only useless interpositions". Fischer made a different move, the rook four squares to the left, and won.

```chess
caption: Fischer vs Bisguier, US Championship 1957/58, New York (round 5). Black offers his queen.
start: 66
1.e4 e6 2.d4 d5 3.Nc3 Bb4 4.e5 b6 5.a3 Bxc3+ 6.bxc3 Qd7 7.Qg4 f5 8.Qg3 Ba6 9.Bxa6 Nxa6 10.Ne2 O-O-O 11.a4 Kb7 12.O-O Qf7 13.c4 Ne7 14.Bg5 dxc4 15.Qc3 Nd5 16.Qxc4 Ra8 17.Bd2 f4 18.Ra3 g5 19.a5 c6 20.axb6 axb6 21.Qb3 Nac7 22.c4 Rxa3 23.Qxa3 Ra8 24.Qb3 Ne7 25.Nc3 Qf5 26.Qb4 Nc8 27.Na4 f3 28.Nc5+ Kb8 29.Nd7+ Kb7 30.Qb3 Qg4 31.Nc5+ Kb8 32.g3 Qxd4 33.Be3 Qa1 {Would you capture Black's queen? 34.Rxa1?? Rxa1+ and every interposition is useless: 35.Bc1 Rxc1+ 36.Qd1 Rxd1#. [%cal Rf1a1,Ra8a1]} 34.Rb1 {Fischer moved the rook four squares to the left instead, and won.} Ra3 35.Nd7+ Kb7 36.Qd1 Qa2 37.Nxb6 Nxb6 38.Rxb6+ Kc8 39.Qxf3 Qxc4 40.Qf8+ Kd7 41.Qxa3
```

- **Fischer vs Weinstein (US Championship 1960/61).** Fischer took a pawn with his queen. Why couldn't Black take the queen with his rook? Because then rook check, the knight has to take, and rook takes knight is mate: "The Black Rook could not leave the back rank." Weinstein, realising he was "busted", resigned.

```chess
caption: Fischer vs Weinstein, US Championship 1960/61 (round 1). The final position: Black resigned after 33.Qxh6.
start: 65
1.e4 e6 2.d4 d5 3.Nc3 Bb4 4.e5 Ne7 5.a3 Bxc3+ 6.bxc3 c5 7.a4 Nbc6 8.Nf3 Qa5 9.Qd2 Bd7 10.Bd3 c4 11.Be2 O-O-O 12.Ba3 f6 13.O-O Nf5 14.Rfe1 Be8 15.g4 Nfe7 16.Bf1 Bd7 17.Bh3 h6 18.Bd6 Rdf8 19.Rab1 Rf7 20.exf6 gxf6 21.Bg3 Ng6 22.Rb5 Qa6 23.Reb1 b6 24.Qc1 Qxa4 25.R5b2 Qa3 26.Qe3 Kb7 27.Nh4 Nxh4 28.Bxh4 e5 29.dxe5 fxe5 30.Rxb6+ Ka8 31.R6b5 Be6 32.Bg3 e4 33.Qxh6 {Fischer has just taken a pawn with his queen. Why can't Black take the queen with the h8-rook? 33...Rxh6 34.Rb8+ Nxb8 35.Rxb8# - the black rook can't leave the back rank. The queen also attacks the rook on h8 and the bishop on e6, so Weinstein resigned. [%cal Rb5b8,Gh6h8,Gh6e6] [%csl Ra8]}
```

- **Fischer vs Seidman (US Championship 1960/61)**, the defender's side: "I have to be careful not to think my King is safe." Grabbing a pawn would have allowed a back-rank mate, since his only flight square was covered by Black's other rook. He made luft instead.

```chess
caption: Fischer vs Seidman, US Championship 1960/61 (round 6). Fischer: "I have to be careful not to think my King is safe."
start: 50
1.e4 e5 2.Nf3 Nc6 3.Bb5 a6 4.Ba4 Nf6 5.O-O Be7 6.Re1 b5 7.Bb3 O-O 8.c3 d5 9.exd5 e4 10.dxc6 exf3 11.Qxf3 Bg4 12.Qg3 Bd6 13.f4 g5 14.d4 Kh8 15.Re5 gxf4 16.Bxf4 Nh5 17.Rxh5 Bxh5 18.Nd2 Re8 19.Rf1 Re2 20.Bd1 Rxd2 21.Bxh5 f6 22.Re1 Bxf4 23.Qxf4 Rxb2 24.Re8+ Qxe8 25.Bxe8 Rxe8 {White to move. Grabbing the c7-pawn (arrow 1) loses at once: 26.Qxc7?? Re1# (arrow 2). The queen no longer guards f1, and the flight square f2 (arrow 3) is covered by the other rook on b2. [%cal Gf4c7,Re8e1,Bg1f2] [%csl Rf2]} 26.h3 {Luft: the king now has h2, which the g2-pawn shields from the b2-rook, so ...Re1+ would only be a check.} b4 27.cxb4 Rxb4 28.Qxf6+ Kg8 29.Qg5+ Kh8 30.Qf4 Ra4 31.Qf7 Rg8 32.Qxc7 Rxa2 33.Qe5+ Rg7 34.g4 h6 35.Qb8+ Rg8 36.c7
```

## 4. Back-Rank Defences and Variations (Chapter 3)

**Luft.** The simplest defence is to give the king "air" in advance: push a pawn in front of the king (h6, or h3 for White) to make a flight square. Fischer shows positions where advancing the pawn is the *only* defence. Exchanging rooks loses, and moving the other rook lets the attacker mate.

```chess
fen: 6k1/5pp1/7p/8/8/8/5PPP/4R1K1 w - - 0 1
caption: With luft the same check is harmless: the pawn on h6 gives the king h7.
1.Re8+ Kh7 {The king walks out.}
```

**Safe recaptures.** When a defender is taken with check, recapture with the piece that keeps the back rank covered. One frame: if White plays Queen-takes-Queen, "Recapture with the Bishop would enable White's Rook to mate". The rook has to recapture.

**Removing a defender first.** Sometimes "power does not work directly, but is effective only if the combination is preceded by a move that eliminates a back-rank defender": a capture or sacrifice that takes off the guard, then the back-rank mate.

**Disconnected rooks.** Rooks that don't protect each other on the back rank are a standing weakness.

**Sideways back-rank mates.** The same pattern works along a file at the side of the board: a king on the edge, hemmed in by its own pieces, checked along the file. Fischer's example, **Fischer vs Pilnik (Santiago, 1959)**: Queen takes knight with check, king takes queen, and the rook moves one square across to mate.

```chess
caption: Fischer vs Pilnik, Santiago 1959 (round 12): a sideways back-rank mate. Pilnik resigned after 33.Qxh7+.
start: 65
1.e4 c5 2.Nf3 Nc6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 d6 6.Bc4 e6 7.Bb3 Be7 8.O-O O-O 9.Be3 Bd7 10.f4 Nxd4 11.Bxd4 Bc6 12.Qe2 Qa5 13.f5 e5 14.Bf2 Bd8 15.Rad1 Bb6 16.g4 h6 17.h4 Nh7 18.Rd3 Kh8 19.g5 Bd4 20.Kh2 Bb5 21.Nxb5 Qxb5 22.c3 Bxf2 23.Rxf2 Qb6 24.Rg2 d5 25.Bxd5 Rad8 26.Qh5 g6 27.Qxh6 Rxd5 28.exd5 e4 29.Rdg3 Qd6 30.h5 Rg8 31.hxg6 fxg6 32.f6 Qxd5 33.Qxh7+ {Queen takes knight with check. 33...Kxh7 34.Rh3# - the rook moves one square to the right and mates along the h-file; g7 is covered by the f6-pawn. [%cal Gg3h3] [%csl Rh7]}
```

## 5. Displacing Defenders (Chapter 4)

"Sometimes a key defensive piece will hinder your attempt to force checkmate. In such situations you may be able to mate after driving that piece away."
- **Drawing away a defender.** Force a guard to capture or move (usually with a check) so that it no longer covers the mating square. The defence is the mirror image: "Black must not allow his Knight to be drawn away."
- **Driving the king.** Checks that force the king off a key square, ideally into the corner where it's smothered by its own pieces. But "driving away the King does not work" if it gets a new escape square.
- **Fischer's example (Seidman vs Fischer, US Championship 1957/58).** White would like to take Fischer's bishop and go two pawns up. But after Rook takes Bishop, Rook takes Rook, Queen recaptures, Black plays Queen takes Pawn with check, "driving the King into the corner", and then mates with a queen check on the back rank. Seidman saw it and played 25.c3 instead.

```chess
fen: 2r1r3/2q1bp1k/3p1p1p/3P1P2/1p2R3/8/PPP1Q1PP/1K2R3 w - - 0 25
caption: Seidman vs Fischer, US Championship 1957/58 (round 2), after 24...Kh7. The game went 25.c3 (and was drawn); this line is Fischer's explanation of why White couldn't take the bishop.
start: 0
{Taking the bishop looks like it wins two pawns...} 25.Rxe7? Rxe7 26.Qxe7 Qxc2+ {Queen takes pawn with check, driving the king into the corner.} 27.Ka1 Qc1+ 28.Rxc1 Rxc1# {The queen check on the back rank decides.}
```

## 6. Attacks on the Enemy Pawn Cover (Chapter 5)

"Sometimes your opponent's King appears completely secure with his own pieces surrounding him on all sides, when in fact he can easily be mated by a sacrifice that breaks up his defense." Every theme here is a **sacrifice that demolishes the pawns in front of the king**, usually Queen-takes-Pawn-check.

```chess
fen: 1n4rk/pp4pp/8/4Q3/8/8/1B4PP/5RK1 w - - 0 1
caption: A pawn-cover sacrifice with all the elements present: queen takes pawn with check, the bishop stops the king recapturing, the rook has an open file.
start: 0
{[%cal Re5g7,Gf1f8,Bb2g7]} 1.Qxg7+! Rxg7 {Forced, and now the rook is pinned by the bishop.} 2.Rf8# {The pinned rook can't come back to g8. [%cal Bb2h8]}
```

- 1.Qxg7+! The king can't take because of the bishop, so 1...Rxg7 is forced. But now that rook is **pinned** to its king along the long diagonal. 2.Rf8#: the rook can't come back to g8 to block.

**Check every element.** "You must be certain all of the elements in the combination are present." Otherwise the sacrifice just throws material away. Fischer gives many near-misses:
- Without the bishop, the king simply takes the queen.
- If the defender has a flight square, or a bishop that can interpose, or the attacking rook can't reach the right file, the sacrifice fails.
- The key feature is that the attacker can reach "the vertical file leading to Black's King with one of his heavy pieces".

**Fischer vs Sherwin (US Championship 1957/58)**, his "extremely difficult combination":
- Fischer played Rook takes Pawn. When Sherwin checked on the back rank, Fischer could have interposed his rook with a discovered bishop check. Instead "I interposed my Queen!", leaving Black facing mate.
- Every defence lost. Taking the queen allowed rook-takes-rook with a discovered bishop check. Taking the bishop allowed rook-takes-rook check and then pawn takes queen. Sherwin made luft, and Fischer played Queen takes Rook, winning a rook. Black soon resigned.

```chess
caption: Fischer vs Sherwin, US Championship 1957/58, New York (round 7): Fischer's "extremely difficult combination".
start: 59
1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6 6.Bc4 e6 7.O-O b5 8.Bb3 b4 9.Nb1 Bd7 10.Be3 Nc6 11.f3 Be7 12.c3 bxc3 13.Nxc6 Bxc6 14.Nxc3 O-O 15.Rc1 Qb8 16.Nd5 exd5 17.Rxc6 dxe4 18.fxe4 Qb5 19.Rb6 Qe5 20.Bd4 Qg5 21.Qf3 Nd7 22.Rb7 Ne5 23.Qe2 Bf6 24.Kh1 a5 25.Bd5 Rac8 26.Bc3 a4 27.Ra7 Ng4 28.Rxa4 Bxc3 29.bxc3 Rxc3 30.Rxf7 {Rook takes pawn! If 30...Rxf7, the rook is pinned by the bishop and 31.Ra8+ mates in three (31...Rc8 32.Rxc8+ Qd8 33.Rxd8#). [%cal Gd5g8,Ga4a8]} Rc1+ {Sherwin checks on the back rank. 31.Rf1 would interpose with a discovered check from the bishop, but Fischer had something better.} 31.Qf1 {'I interposed my Queen!' Now Rxf8 is mate. 31...Rxf1 allows 32.Rxf1 with a discovered check from the bishop. [%cal Rf7f8,Gd5g8]} h5 {Sherwin makes an escape square for his king next to his queen.} 32.Qxc1 {Queen takes rook: White is a rook up, and Black soon resigned.} Qh4 33.Rxf8+ Kh7 34.h3 Qg3 35.hxg4 h4 36.Be6
```

## 7. The Patterns at a Glance

| Pattern | What makes it work | Defence |
|---|---|---|
| Back-rank mate | King hemmed in by its own pawns; open file to the back rank | Luft; keep a piece guarding the back rank |
| Counting power | More attackers than defenders of the mating square (only checking pieces count) | Add a defender; trade off an attacker |
| Removing a defender | Capture or sacrifice takes off the back-rank guard first | Recapture with the right piece |
| Drawing away | A check or threat forces a guard off its post | Don't let key defenders be lured away |
| Driving the king | Checks force the king into the corner | Keep flight squares; don't walk into the corner |
| Pawn-cover sacrifice | Queen takes pawn with check, the recapture is impossible or creates a pin, and a heavy piece reaches the file | Check every element; keep pieces near the king |
| Sideways back-rank mate | The same pattern on an edge file | Same as the back-rank mate |

## 8. Assessment

*Mine.*

- **It works because it's narrow.** One theme (mating combinations, mostly on the back rank) drilled from many angles with active answers. That's exactly how pattern recognition is built. It's the best argument in the chess literature for programmed instruction: after a few hundred frames, "back rank, no luft, rook on an open file" jumps off the board.
- **Fischer's "power" count is a real tool**, not just a teaching trick. Count attackers and defenders of the key square, remember that only checking pieces count, and you can often tell in seconds whether a combination works without calculating every line.
- **The defender's half matters as much.** Half the frames ask why a mate *fails*: a useful interposition, a flight square, a pinned attacker, an unnoticed bishop. "Let not him that girdeth on his harness boast himself as he that putteth it off" (1 Kgs 20:11): many lost games come from attacking too soon, and Fischer keeps warning against thinking your own king is safe.
- **Limits.** It isn't a complete course. There's nothing on openings, strategy or endgames beyond mates, and it uses descriptive phrases ("Rook-takes-Rook") rather than notation. Pair it with Seirawan for principles and Chernev for whole games. See [[Chess Tactics and Opening Traps: Pins, Forks and Discoveries]].
- A personal note: the book shows Fischer at his best, as a clear and generous teacher who uses his own games, including his near-mistakes, as lessons. It's a different picture from the troubled later years.

## Related

- [[Chess Tactics and Opening Traps: Pins, Forks and Discoveries]]
- [[Elementary Chess Endgames: Mating the Lone King, Opposition and Underpromotion]]
- [[Can a Computer Understand Chess? Turing, Searle, Dreyfus and Deep Blue]]
- [[The Mathematics of Chess: Zermelo, Shannon, Eight Queens and the Knight's Tour]]
