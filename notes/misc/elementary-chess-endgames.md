---
id: M-0376
date: 2026-10-20
title: "Elementary Chess Endgames: Mating the Lone King, Opposition and Underpromotion"
tags: [chess, endgames]
summary: "The basic endgames every player needs. Why the king becomes a fighting piece. King and queen vs king by Seirawan's box method (shrink the box, no useless checks, beware stalemate). King and rook vs king (drive the king to the edge, then mate from the 'face-off'). King and pawn vs king: opposition, the king on the sixth rank, the rule of the square and the rook-pawn draw. Underpromotion to a rook (avoiding stalemate) and to a knight (a forking check). With board diagrams for each and an assessment."
source: "Yasser Seirawan with Jeremy Silman, Play Winning Chess (Microsoft Press/Tempus, 1990), ch. 2 'The First Principle: Force' (sections 'The King Plays in the Endgame', 'Material Advantage in the Endgame', 'When Less Is More'); king-and-pawn endings (opposition, rule of the square) supplemented from standard endgame theory, with the example lines worked out here; Scripture KJV"
aliases: [Chess Endgames, King and Queen vs King, King and Rook vs King, Opposition, Rule of the Square, Underpromotion, Box Method]
---

> "Better is the end of a thing than the beginning thereof." (Ecclesiastes 7:8)

> "But he that shall endure unto the end, the same shall be saved." (Matthew 24:13)

> "Let us not be weary in well doing: for in due season we shall reap, if we faint not." (Galatians 6:9)

Seirawan's point is simple: "It's no use playing a good opening and gaining a material advantage in the middlegame if you don't know how to win from there!" The **endgame** has its own rules. The **king becomes a fighting piece**, a few basic mates must be known by heart, and with only kings and pawns left, everything turns on **opposition** and counting squares. Here's how it works:

All diagrams have White at the bottom. Yellow squares show the last move or the area being discussed; a red square marks a king in check or trapped.

## 1. The King Comes Out

- In the opening and middlegame the king is "for the most part a liability", hidden behind pawns after castling.
- In the endgame most pieces are gone, so "once the board has been cleared of King-eating piranhas, his majesty can safely take a stroll". The king becomes "a fighting piece of great power".
- **Rule:** bring the king into play as soon as it's safe. It's "particularly safe when only pawns are left".

Seirawan says that with just two techniques, king and queen vs king and king and rook vs king, you "should be able to win almost every game if you are ahead by a Rook or more". These come up all the time, so learn them until they're automatic.

## 2. King and Queen vs King: The Box Method

Two facts first:
1. **The queen can't mate alone.** The king has to walk over and help.
2. **Mate is only possible at the edge of the board.**

**The method:** use the queen to trap the enemy king in a **box**, then make the box smaller with quiet queen moves, never with pointless checks. Once the king is pinned to the edge, bring your own king over and mate. It isn't the fastest method, but it's the easiest.

![[kq-box.svg|360]]

*After 1.Qb5: the queen cuts off the fifth rank and the b-file, so the black king is in a box (shaded) on files c–h, ranks 6–8.*

Seirawan's line (my reconstruction of his starting position, with the white king on a1):
- 1.Qb5 Ke6 2.Qc5 Kf6 3.Qd5 Kg6 4.Qe5 Kf7 5.Qd6 Kg7 6.Qe6 Kh7 7.Qg4.
- Each queen move takes away a rank or a file. He points out that White "does not lose track of his goals by uselessly checking". For example, 2.Qc6+? would let the king out with 2...Ke5.
- If 4...Kh6, then 5.Qg3 traps it on the h-file at once.

![[kq-edge.svg|360]]

*After 7.Qg4: the black king can only shuffle between h6, h7 and h8. Now the white king walks over (blue arrow).*

- 7...Kh6 8.Kb2 Kh7 9.Kc3 Kh8 10.Kd4 Kh7 11.Ke5 Kh8 12.Kf6 Kh7 13.Qg7#.

![[kq-stalemate.svg|360]]

*The trap to avoid: with the black king on h8, 10.Qg6?? is stalemate. Black isn't in check but has no legal move, so it's a draw.*

![[kq-mate.svg|360]]

*13.Qg7#: the queen, protected by the king on f6, covers every square around the black king.*

- **Stalemate is the danger.** When the box gets very small, always check that the defending king still has a move.

## 3. King and Rook vs King

The rook is weaker, so the king has to do more of the work. Seirawan's principles:
- **White** should bring his king as close as possible to the black king (one square apart) and only then use the rook.
- **Black** should keep his king in the **middle** of the board, where mate is impossible.
- **The key position is the "face-off"** (what other books call **opposition**): the two kings directly opposite each other with one square between. Then a rook check along the edge is mate, or at least forces the king back a row. "A Rook check is always strong when the Kings face off, because the checked King is thereby forced to relinquish ground."

![[kr-cage.svg|360]]

*The cage: with the rook on e5 and the white king on d4, the black king is confined to the shaded squares (files f–h, ranks 6–8). White shrinks the cage with king moves, using the rook only to cut off ranks or files.*

His main line, from the cage: 7...Kg6 8.Ke4 Kf6 9.Kf4 Kf7 10.Kf5 Kg7 11.Re7+ Kf8 12.Kf6.
- 9.Rf5+? would be "hasty", letting the king run with ...Ke6.
- After 11.Re7+ the king has reached the edge. Mate now needs the face-off.

![[kr-face-off.svg|360]]

*After 12.Kf6, Black to move: the kings face off on the f-file. The black king must step aside to g8, since e8 is covered by the rook.*

- 12...Kg8 13.Kg6 Kf8 14.Re6 (a waiting move: the rook "steps back a bit") Kg8 (forced) 15.Re8#.
- **The waiting move.** When the defending king won't step into the face-off, the attacker *loses a move* with the rook along its rank or file, forcing the king to walk into it. In another of Seirawan's lines, after 11...Kh6, White plays 12.Rd7 and the king must go 12...Kh5 into the face-off, when 13.Rh7 is mate.

![[kr-mate.svg|360]]

*15.Re8#: the white king on g6 covers f7, g7 and h7, and the rook covers the whole eighth rank.*

- **Again, beware stalemate.** In a side line Seirawan warns against 16.Rg2?? when 16.Rh3# was available.

## 4. King and Pawn vs King: Opposition

Not in Seirawan's beginner chapter, but it's the next thing everyone learns. These are standard results; I've worked out the lines below myself.

**Opposition.** Two kings stand on the same file (or rank) with one square between them. The side that **doesn't** have to move "has the opposition". Kings can never stand next to each other, so the player who must move has to give way.

![[opposition.svg|360]]

*White: king e5, pawn e4. Black: king e7. Who's to move decides the game.*

1. **White to move: draw.** White has to give up the opposition. 1.Kd5 Kd7 2.e5 Ke7 3.e6 Ke8! 4.Kd6 Kd8 5.e7+ Ke8 6.Ke6 is stalemate, since Black has no legal move.
2. **Black to move: White wins.** Black must step aside and White's king gets in front. 1...Kd7 2.Kf6 Ke8 3.e5 Kf8 4.e6 Ke8 5.e7 Kd7 6.Kf7, and the pawn queens.

**The rules of thumb**
- **The king leads, the pawn follows.** Pushing the pawn first usually just draws.
- **The defender's goal** is to stand in front of the pawn and keep the opposition.
- **King on the sixth.** If the attacker's king reaches the sixth rank in front of its pawn (e.g. White king e6, pawn e5, black king e8), White wins whoever is to move. White to move: 1.Kd6 Kd8 2.e6 Ke8 3.e7 Kf7 4.Kd7, and the pawn queens. Black to move: 1...Kd8 2.Kf7 or 1...Kf8 2.Kd7, and the pawn walks through.
- **The rook-pawn exception.** With an a- or h-pawn, a defending king that reaches the corner can't be driven out. It's usually a draw even when the attacking king is close, because every attempt ends in stalemate.

## 5. The Rule of the Square

How do you tell at a glance whether a king can catch a passed pawn with no help from the other king? Draw a **square** from the pawn to its queening square, as wide as it is long. If the defending king can step into the square on its move, it catches the pawn. If not, the pawn queens.

![[rule-of-the-square.svg|360]]

*The pawn on c4 has four squares to go, so its square is c4–c8–g8–g4 (shaded).*

1. **Black to move:** 1...Kg5 steps into the square. 2.c5 Kf6 3.c6 Ke7 4.c7 Kd7 5.c8=Q+ Kxc8, and Black is in time.
2. **White to move:** 1.c5 shrinks the square to c5–f8, and h5 is outside it. 1...Kg6 2.c6 Kf7 3.c7 Ke7 4.c8=Q, one move too late.

(Count a pawn on its starting rank as if it were already on the third, because of the double step.)

## 6. When Less Is More: Underpromotion

A pawn reaching the last rank usually becomes a queen, but not always. Promoting to anything else is **underpromotion**, and Seirawan gives two reasons for it.

**1. To avoid stalemate (promote to a rook).**

![[underpromotion-rook.svg|360]]

*A position of the type Seirawan shows (my reconstruction), White to move. 1.dxc8=Q?? stalemates the black king on a7: a8, b8, b7 and a6 are covered by the queen, and b6 by the white king. 1.dxc8=R! leaves Black 1...Kb7, and White has the king and rook vs king ending from section 3.*

- His point: here "the pawn is better than the Rook", and the rook is better than the queen.

**2. To give a forking check (promote to a knight).**

![[underpromotion-knight.svg|360]]

*My own illustration of his second example. Black is a queen ahead, but 1.c8=N+! is check and forks the king on a7 and the queen on e7. After the king moves, 2.Nxe7 leaves White a knight up instead of just level.*

- In Seirawan's version, White then promotes another pawn to a queen "and the win is easy".
- **Moral:** "Generalities are useful in chess. However, the specifics of a position determine whether a particular principle applies."

## 7. Assessment

*Mine.*

- **Learn these until they're automatic.** Seirawan's late-night scene, a queen up against your archenemy and unable to mate, is every beginner's experience. The box method and the rook face-off take an evening to learn and save hundreds of half-points.
- **The common enemy is stalemate.** Every one of these endings has a stalemate trap: Qg6?? in the queen ending, Rg2?? in the rook ending, the rook-pawn corner and the over-hasty queen promotion. The winning side's real job is not to attack but to make sure the losing side always has a legal move until the last one.
- **No useless checks.** The box method is a little parable. Checking feels active but usually lets the king out. The quiet move that takes away a rank does more. "Better is the end of a thing than the beginning thereof" (Eccl 7:8): the endgame rewards patience and technique, not flourishes.
- **Opposition is the deepest idea here.** The side that *doesn't* have to move wins. That's counter-intuitive, and it's the first place in chess where **having to move is a disadvantage** (*zugzwang*). The same idea runs through the whole endgame.

## Related

- [[Chess Tactics and Opening Traps: Pins, Forks and Discoveries]]
- [[Bobby Fischer's Checkmate Patterns: Back-Rank Mates, Displacing Defenders and Pawn Cover]]
- [[The Mathematics of Chess: Zermelo, Shannon, Eight Queens and the Knight's Tour]]
- [[Can a Computer Understand Chess? Turing, Searle, Dreyfus and Deep Blue]]
