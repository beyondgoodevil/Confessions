---
id: M-0379
date: 2026-10-20
title: "The Mathematics of Chess: Zermelo, Shannon, Eight Queens and the Knight's Tour"
tags: [mathematics, chess]
summary: "The mathematics in and around chess. The wheat-and-chessboard sum $2^{64}-1$. Zermelo's theorem (1913): chess is determined (a forced win for White, a forced win for Black, or a draw), proved by backward induction, yet nobody knows which; checkers solved as a draw (2007). Shannon's 1950 paper: about 30 moves per position, the 10^120 game tree, minimax, Type A vs Type B search; Tromp's 4.8 × 10^44 legal positions. Endgame tablebases and retrograde analysis (all 7-piece endings solved; a 549-move mate). Puzzles on the board: eight queens (92 solutions, 12 fundamental), the knight's tour (Warnsdorff's rule, 13 trillion closed tours) and the mutilated chessboard. With diagrams and an assessment."
source: "Bill Martin, 'The Difficult Ways of God and Caissa: Chess, Theodicy, and Determinism in Gadamer', and Bernd Graefrath, 'To Know the Past One Must First Know the Future: Raymond Smullyan and the Mysteries of Retrograde Analysis', in Benjamin Hale, ed., Philosophy Looks at Chess (Open Court, 2008), chs. 1 and 6; web: Wikipedia, 'Solving chess', 'Eight queens puzzle', 'Knight's tour', 'Endgame tablebase'; John Tromp, 'The number of legal chess positions is ~4.8 × 10^44' (TalkChess, 2021); Lichess, '7-piece Syzygy tablebases are complete' (2018); Brendan McKay, 'Knight's Tours of an 8×8 Chessboard' (ANU TR-CS-97-03, 1997); Scripture KJV and Apocrypha"
aliases: [Mathematics of Chess, Zermelo's Theorem, Shannon Number, Eight Queens Puzzle, Knight's Tour, Mutilated Chessboard, Endgame Tablebase, Wheat and Chessboard]
---

> "But thou hast ordered all things in measure and number and weight." (Wisdom of Solomon 11:20)

> "He telleth the number of the stars; he calleth them all by their names." (Psalm 147:4)

> "O the depth of the riches both of the wisdom and knowledge of God! how unsearchable are his judgments, and his ways past finding out!" (Romans 11:33)

Chess is a **finite** game: 64 squares, 32 pieces, rules that make every game end. So in principle it's a mathematical object that could be **solved**. **Zermelo** proved in 1913 that it has a definite value, and **Shannon** showed in 1950 why we'll never compute it by brute force. Meanwhile the board itself has been a playground for combinatorics for centuries: the **eight queens**, the **knight's tour**, the **mutilated chessboard**. Here's how it works:

## 1. The Wheat and the Chessboard

The legend: the inventor of chess asks his king for one grain of wheat on the first square, two on the second, four on the third, doubling each time. The king laughs at so small a request.

The total is a geometric series:

$$1 + 2 + 4 + \dots + 2^{63} = \sum_{k=0}^{63} 2^k = 2^{64} - 1 = 18{,}446{,}744{,}073{,}709{,}551{,}615.$$

That's about 18 quintillion grains, far more wheat than the world has ever grown. **Moral:** exponential growth beats intuition. The same doubling is why chess can't be solved by brute force (section 3).

## 2. Zermelo's Theorem: Chess Is Determined

**The claim** (Ernst Zermelo, 1913, "On an application of set theory to the theory of the game of chess"). In a finite two-player game of **perfect information** with **no chance**, exactly one of these holds:
1. White has a strategy that **forces a win**.
2. Black has a strategy that forces a win.
3. Both sides can **force at least a draw**.

Chess qualifies. Both players see everything, there are no dice, and the draw rules (repetition, the fifty-move rule) make every game finite.

**The idea of the proof: backward induction.** Label every position from the end:
1. Positions where the game is over get their result: win, loss or draw.
2. A position where it's your move is a **win** if *some* move leads to a position that's a win for you. It's a **loss** if *every* move leads to a loss. Otherwise it's a draw.
3. Since the game is finite, this labelling works all the way back to the starting position, which therefore has a definite value.

This is **minimax**: each side picks the move that is best assuming the other side replies with its best. Zermelo's own proof was set-theoretic, but backward induction is how it's usually taught now.

**What we don't know.** *Which* of the three is true. Most strong players and theorists believe chess is a **draw** with perfect play, but it isn't proved and may never be.
- **Checkers has been solved:** Jonathan Schaeffer's team proved in 2007 that it's a draw with perfect play. Chess is vastly larger.
- Bill Martin (in *Philosophy Looks at Chess*) quotes the description of such games as "games of no chance": "finite, two-person, full-information games such as chess, checkers, go". In principle they can be solved "right down to the last piece".

## 3. Shannon and the Size of Chess

Claude Shannon's "Programming a Computer for Playing Chess" (1950) founded computer chess.
- **Branching factor.** A typical position has about **30 legal moves**. A typical game lasts about **40 moves** each, so about $30^{80} \approx 10^{120}$ possible games. This is the **Shannon number**, a rough estimate of the **game tree**, not the number of positions.
- **Positions.** Shannon estimated about $10^{43}$. **John Tromp (2021)** sampled random positions and checked each for legality, putting the number of **legal positions** at about $4.8 \times 10^{44}$.
- **For comparison:** the number of atoms in the observable universe is usually put at around $10^{80}$. The game tree is unimaginably larger. Even the set of positions is far beyond anything that could be stored.
- **Type A and Type B.** Shannon distinguished **Type A** programs, which search every move to a fixed depth (brute force), from **Type B** programs, which search selectively, looking only at plausible moves, as humans do. Deep Blue was largely Type A with selective extensions. Modern neural-network engines are closer to Type B: they "see" which moves are worth looking at. See [[Can a Computer Understand Chess? Turing, Searle, Dreyfus and Deep Blue]].

## 4. Endgame Tablebases: Chess Solved from the End

Where Zermelo's induction *can* be carried out is in the **endgame**. Start from every possible mate with a few pieces and work backwards (**retrograde analysis**), labelling every position as win, draw or loss with the exact distance to mate.
- **All positions with up to 7 pieces** (counting kings) are solved. The Lomonosov tables (Moscow, 2012) were the first. The Syzygy tables (2018) compressed them to about 18 TB.
- **The longest forced mate** found in them is **549 moves** (depth to mate). No human could find it, and many of these wins look like random shuffling to a human.
- **8-piece tables** are in progress.
- **Retrograde analysis as puzzle.** The same backward reasoning powers Raymond Smullyan's retro problems (the subject of Graefrath's chapter, "To Know the Past One Must First Know the Future"): given a position, deduce what *must* have happened (which piece was captured, whether castling is still legal). Graefrath draws two lessons from Smullyan: a "cognitive optimism" that careful reasoning can unravel apparently impossible puzzles, and its limit, that some puzzles have no answer.

## 5. The Eight Queens

**Puzzle** (Max Bezzel, 1848): place eight queens on the board so that **no two attack each other**, i.e. no two share a rank, file or diagonal.

```chess
fen: 2Q5/5Q2/3Q4/1Q6/7Q/4Q3/6Q1/Q7 w - - 0 1
caption: One of the 92 solutions: a1, b5, c8, d6, e3, f7, g2, h4. Every rank, file and diagonal has at most one queen.
{Each queen's lines are clear of the others, e.g. the long diagonal from a1. [%cal Ga1h8,Ba1a8,Ya1h1]}
```

- **How many?** Franz Nauck (1850) gave the full count: **92 solutions**. Counting rotations and reflections as the same, there are **12 fundamental solutions**. Eleven of them have 8 variants each and one (symmetric under a 180° turn) has only 4: $11 \times 8 + 4 = 92$. Gauss took an interest in the problem, but the claim that he solved it first appears to be wrong.
- **Check it with arithmetic.** Number the files and ranks 1–8. Queens on $(c, r)$ don't share a diagonal exactly when all the differences $c - r$ are distinct and all the sums $c + r$ are distinct. For the solution above, the ranks are 1, 5, 8, 6, 3, 7, 2, 4 (a permutation), the differences are 0, −3, −5, −2, 2, −1, 5, 4 and the sums are 2, 7, 11, 10, 8, 13, 9, 12. All distinct.
- **Generalisation:** the **n-queens problem**, a standard exercise for **backtracking** algorithms. Place a queen column by column and back up when stuck.

## 6. The Knight's Tour

**Puzzle:** move a knight so that it visits **every square exactly once**. It's **closed** (re-entrant) if the last square is a knight's move from the first.

```chess
fen: 8/8/8/8/8/8/8/N7 w - - 0 1
solo: true
trail: true
start: 0
caption: A complete knight's tour found by Warnsdorff's rule, starting from a1: always move to the square with the fewest onward moves. Press play to watch the knight visit all 64 squares.
{From the corner the knight has only 2 moves; from a central square it has 8. Warnsdorff's rule visits the awkward squares first. [%cal Ga1b3,Ga1c2]} 1.Nb3 2.Nc1 3.Na2 4.Nb4 5.Na6 6.Nb8 7.Nd7 8.Nf8 9.Nh7 10.Ng5 11.Nh3 12.Ng1 13.Ne2 14.Ng3 15.Nh1 16.Nf2 17.Nd1 18.Nb2 19.Na4 20.Nb6 21.Na8 22.Nc7 23.Ne8 24.Ng7 25.Nh5 26.Nf6 27.Ng8 28.Nh6 29.Ng4 30.Nh2 31.Nf1 32.Nd2 33.Nb1 34.Nc3 35.Ne4 36.Nc5 37.Ne6 38.Nd8 39.Nb7 40.Na5 41.Nc6 42.Na7 43.Nc8 44.Ne7 45.Nd5 46.Nf4 47.Nd3 48.Ne1 49.Ng2 50.Nh4 51.Nf3 52.Nd4 53.Nf5 54.Ne3 55.Nc2 56.Na3 57.Nb5 58.Nd6 59.Nc4 60.Ne5 61.Nf7 62.Nh8 63.Ng6
```

- **History.** Studied by Euler (a memoir of 1759, published 1766) among many others, and much older in Indian and Arabic sources.
- **Warnsdorff's rule** (H. C. von Warnsdorf, 1823): always move to the square from which the knight will have the **fewest onward moves**. Visit the hard-to-reach squares (corners and edges) first, before they get cut off. It's a simple greedy heuristic that almost always finds a tour on an 8×8 board.
- **How many?** Brendan McKay (1997) computed **13,267,364,410,532** closed tours, or 26,534,728,821,064 if a tour and its reverse are counted separately.
- **A colour argument.** A knight always moves to a square of the **opposite colour**. So a closed tour alternates colours and needs an even number of squares. That's why no closed tour exists on a board with an odd number of squares (e.g. 5×5). In graph terms, the **knight's graph is bipartite**, and a knight's tour is a **Hamiltonian path** in it.

## 7. The Mutilated Chessboard

**Puzzle:** cut off two opposite corners (a1 and h8). Can the remaining 62 squares be covered exactly by 31 dominoes, each covering two adjacent squares?

```chess
fen: 8/8/8/8/8/8/8/8 w - - 0 1
caption: The mutilated chessboard: remove a1 and h8 (both dark squares). Every domino covers one light and one dark square, but 30 dark and 32 light remain, so 31 dominoes can't cover the board.
{[%csl Ra1,Rh8]}
```

- **No.** Every domino covers **one light and one dark** square, so 31 dominoes cover 31 of each. But a1 and h8 are the **same colour** (both dark), so the mutilated board has **32 light and 30 dark** squares. Impossible.
- **Why it's famous:** trying cases is hopeless, but one well-chosen **invariant** (colour counting) settles it in a line. It's the same colour fact that rules out closed knight's tours on odd boards. Good mathematics often means finding the right thing to count.

## 8. The Numbers at a Glance

| Quantity | Value | Source |
|---|---|---|
| Wheat on the chessboard | $2^{64}-1 \approx 1.8 \times 10^{19}$ grains | Geometric series |
| Typical legal moves per position | about 30 | Shannon (1950) |
| Game-tree size (Shannon number) | about $10^{120}$ games | Shannon (1950) |
| Legal positions | about $4.8 \times 10^{44}$ | Tromp (2021) |
| Endings solved | all with ≤ 7 pieces | Lomonosov (2012), Syzygy (2018) |
| Longest 7-piece forced mate | 549 moves | Lomonosov tables |
| Eight-queens solutions | 92 (12 fundamental) | Nauck (1850) |
| Closed knight's tours | 13,267,364,410,532 | McKay (1997) |

## 9. Assessment

*Mine.*

- **Determined but unknown.** Zermelo's theorem is a good image of the relation between necessity and knowledge. The value of the starting position is *fixed*, and has been since the rules were set, but no finite mind will ever compute it. The game is completely determinate *in itself* and completely open *to us*. "How unsearchable are his judgments, and his ways past finding out!" (Rom 11:33).
- **Martin's point about the composer.** Bill Martin observes that a chess problem's composer works backwards from the solution, so the problem comes "front-loaded with its own 'local theodicy'". To the composer, nothing in the position is absurd. Tablebases are that composer's view made literal: from the end, every bizarre shuffle in a 549-move mate has its reason. Christians say God sees the world not as a solver grinding through a tree, but as one who declares "the end from the beginning" (Isa 46:10) *without* that knowledge forcing the players' moves. See [[Free Will and Divine Foreknowledge]] and [[The Problem of Evil and Theodicy]].
- **Finite but not exhaustible.** $4.8 \times 10^{44}$ positions is finite. That's why chess is determined, and why the threefold-repetition rule can exist at all. (It also echoes Nietzsche's argument for eternal recurrence from a finite number of states; see [[Nietzsche: Eternal Recurrence]].) But "finite" is no comfort at that size. Chess sits between the infinite and the manageable: big enough to be inexhaustible for any creature, small enough to be "solved" in principle. That's part of why it's such a good game.
- **Measure, number and weight.** The puzzles show what the Fathers and the medieval *quadrivium* took for granted: number is woven into creation (Wis 11:20), and even a game board, a human artefact, turns out to have structure nobody put there on purpose. Nobody designed the knight's move so that its graph would be bipartite, or the board so that a1 and h8 would be the same colour. The mathematics was *found*, not invented.
- **And the human remains.** None of this tells you how to play 1.e4. The mathematics settles the game in principle and leaves every actual game wide open, which is the subject of [[Chess Tactics and Opening Traps: Pins, Forks and Discoveries]] and [[Elementary Chess Endgames: Mating the Lone King, Opposition and Underpromotion]].

## Related

- [[Can a Computer Understand Chess? Turing, Searle, Dreyfus and Deep Blue]]
- [[Chess Tactics and Opening Traps: Pins, Forks and Discoveries]]
- [[Elementary Chess Endgames: Mating the Lone King, Opposition and Underpromotion]]
- [[Bobby Fischer's Checkmate Patterns: Back-Rank Mates, Displacing Defenders and Pawn Cover]]
- [[Free Will and Divine Foreknowledge]]
- [[The Problem of Evil and Theodicy]]
- [[Nietzsche: Eternal Recurrence]]
