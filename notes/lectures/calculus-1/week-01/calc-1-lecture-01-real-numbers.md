---
id: L-0004
title: "Calc I, Lecture 01: Real Numbers, Inequalities and Absolute Value"
course: Calculus I
lecture: 1
week: 1
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 1 (Basic Properties of Numbers) and Ch. 2 (Numbers of Various Sorts)"
summary: The twelve basic properties of numbers, how every rule about inequalities follows from them, the triangle inequality, and why the rationals are not enough.
---

The whole course runs on a short list of **basic properties of numbers** (Spivak's P1–P12): nine about **addition and multiplication**, three about **order**. Everything we "know" about algebra and inequalities, including the **triangle inequality** $|a+b| \le |a| + |b|$, can be derived from that list. The list is still incomplete, though, because it holds for $\mathbb{Q}$ as well as $\mathbb{R}$. Here's how it works:

### 1. Why Start Here

Calculus is basically **inequalities**: "$f(x)$ is within $\varepsilon$ of $l$ whenever $x$ is within $\delta$ of $a$". So before limits we need to be completely fluent in manipulating $<$, $\le$ and $|\cdot|$, and to know *why* the manipulations are legal. Spivak's framing (Ch. 1) is that this chapter is **not a review**: it compresses everything familiar into a few properties and then checks that the familiar facts really follow from them.

### 2. The Field Properties (P1–P9)

For all numbers $a, b, c$:

| | Addition | Multiplication |
|---|---|---|
| Associative | (P1) $a+(b+c) = (a+b)+c$ | (P5) $a(bc) = (ab)c$ |
| Identity | (P2) $a + 0 = a$ | (P6) $a \cdot 1 = a$, and $1 \ne 0$ |
| Inverse | (P3) $a + (-a) = 0$ | (P7) $a \cdot a^{-1} = 1$ for $a \ne 0$ |
| Commutative | (P4) $a+b = b+a$ | (P8) $ab = ba$ |

and the one that links them, the **distributive law** (P9): $a(b + c) = ab + ac$.

- **Subtraction and division are defined**, not basic: $a - b$ means $a + (-b)$ and $a/b$ means $a \cdot b^{-1}$. Since $0^{-1}$ doesn't exist, **$a/0$ is meaningless**.
- **$1 \ne 0$ has to be listed.** Every other property would hold in a "number system" with only one element, so it can't be proved from the rest.
- **P9 does almost all the work.** Factoring $x^2 - 3x + 2 = (x-1)(x-2)$ is three uses of P9, and so is long multiplication.

> [!theorem] Consequences of P1–P9
> 1. $a \cdot 0 = 0$.
> 2. If $ab = 0$ then $a = 0$ or $b = 0$.
> 3. $(-a)b = -(ab)$ and $(-a)(-b) = ab$.

> [!proof]
> (1) $a\cdot 0 + a \cdot 0 = a(0+0) = a \cdot 0$; add $-(a \cdot 0)$ to both sides.
> (2) If $ab = 0$ and $a \ne 0$, multiply by $a^{-1}$: $b = a^{-1}(ab) = a^{-1}\cdot 0 = 0$.
> (3) $(-a)b + ab = [(-a)+a]b = 0 \cdot b = 0$, so $(-a)b = -(ab)$. Then $(-a)(-b) + [-(ab)] = (-a)(-b) + (-a)b = (-a)[(-b)+b] = 0$, so $(-a)(-b) = ab$.

Takeaway: "negative times negative is positive" isn't a convention. It is **forced** by P1–P9.

### 3. The Order Properties (P10–P12)

Instead of taking $<$ as basic, Spivak takes the collection $P$ of **positive numbers** as basic:

1. **(P10) Trichotomy**: for every $a$, exactly one of $a = 0$, $a \in P$, $-a \in P$ holds.
2. **(P11) Closure under addition**: $a, b \in P \Rightarrow a + b \in P$.
3. **(P12) Closure under multiplication**: $a, b \in P \Rightarrow ab \in P$.

> [!definition] Order
> $a > b$ means $a - b \in P$; $a < b$ means $b > a$; $a \le b$ means $a < b$ or $a = b$.

Everything about inequalities now follows:

- **Adding to both sides**: if $a < b$ then $(b + c) - (a + c) = b - a \in P$, so $a + c < b + c$.
- **Transitivity**: $a < b$, $b < c$ ⇒ $c - a = (c - b) + (b - a) \in P$ by P11.
- **Two negatives**: if $a < 0$ and $b < 0$ then $-a, -b \in P$, so $ab = (-a)(-b) \in P$.
- **Squares**: $a \ne 0 \Rightarrow a^2 > 0$. In particular $1 = 1^2 > 0$, which then gives $1 + 1 \ne 0$ (needed to divide by 2!).

> [!note] Multiplying an inequality by a negative flips it
> If $a < b$ and $c < 0$, then $ac - bc = (a - b)c = (b-a)(-c) \in P$, so $ac > bc$. This is the step that kills people on exams.

### 4. Absolute Value and the Triangle Inequality

> [!definition] Absolute value
> $|a| = a$ if $a \ge 0$, and $|a| = -a$ if $a \le 0$.

Geometrically, $|a - b|$ is the **distance** between $a$ and $b$ on the line (Ch. 4). So $|x - a| < \delta$ means "$x$ is within $\delta$ of $a$", i.e. $a - \delta < x < a + \delta$. This translation gets used constantly.

> [!theorem] Triangle inequality (Spivak Theorem 1-1)
> For all $a, b$: $|a + b| \le |a| + |b|$.

> [!proof]
> Spivak gives a four-case proof, then a slicker one using $|a| = \sqrt{a^2}$:
> $$(|a+b|)^2 = (a+b)^2 = a^2 + 2ab + b^2 \le a^2 + 2|a||b| + b^2 = (|a| + |b|)^2,$$
> and for nonnegative $x, y$, $x^2 \le y^2 \Rightarrow x \le y$ (Problem 1-5).

- **Equality** holds exactly when $a, b$ have the same sign (or one is $0$).
- **Reverse triangle inequality** (Problem 1-12): $\big||a| - |b|\big| \le |a - b|$. Proof: apply the triangle inequality to $a = (a - b) + b$ and to $b = (b - a) + a$. We'll use this in the $x^2$ limit proof in Lecture 5.

### 5. Worked Examples

1. **Solve $4 - x < 3 - 2x$.** Add $2x - 4$: $x < -1$.
2. **Solve $|x - 3| < 8$.** Distance from $3$ less than $8$: $-8 < x - 3 < 8$, so $-5 < x < 11$.
3. **Solve $(x - 1)(x - 3) > 0$.** A product is positive iff both factors have the same sign: both positive gives $x > 3$; both negative gives $x < 1$. Answer: $x < 1$ or $x > 3$.
4. **Show $0 < a < b \Rightarrow a < \sqrt{ab} < \tfrac{a+b}{2} < b$** (Problem 1-7). The middle one: $\tfrac{a+b}{2} - \sqrt{ab} = \tfrac12(\sqrt b - \sqrt a)^2 > 0$. This is the **AM–GM inequality** for two numbers, and it's really "squares are positive" again.

### 6. Number Systems, Induction, and a Hole in $\mathbb{Q}$

Ch. 2 sorts the numbers: $\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R}$.

- $\mathbb{N}$ fails P2, P3 (no $0$, no negatives); $\mathbb{Z}$ fails only P7; **$\mathbb{Q}$ satisfies all of P1–P12**.
- **Induction**: if $P(1)$ holds and $P(k) \Rightarrow P(k+1)$, then $P(n)$ holds for all $n \in \mathbb{N}$. Standard example: $1 + 2 + \cdots + n = \tfrac{n(n+1)}{2}$, since $\tfrac{k(k+1)}{2} + (k+1) = \tfrac{(k+1)(k+2)}{2}$. This formula comes back in Lecture 34 for areas.

> [!theorem] $\sqrt 2$ is irrational
> There is no rational $x$ with $x^2 = 2$.

> [!proof]
> Suppose $(p/q)^2 = 2$ with $p, q$ natural numbers and no common factor. Then $p^2 = 2q^2$ is even, so $p$ is even (odd numbers have odd squares): $p = 2k$. Then $4k^2 = 2q^2$, so $q^2 = 2k^2$ is even and $q$ is even. Both even, which is a contradiction.

**Why this matters:** P1–P12 are all true in $\mathbb{Q}$, and $\mathbb{Q}$ has no $\sqrt 2$. So P1–P12 **can't prove that $\sqrt 2$ exists**. Something is missing from the list, and that missing property (the **least upper bound property**, P13) is what makes the big theorems of Lecture 10 and Lecture 11 true.

### 7. Problems to Try

- **Ch. 1**: 1 (algebra from the axioms), 4 and 11 (solving inequalities), 5 (the inequality rules), 7 (AM–GM), 12 (properties of $|\cdot|$), 19 (Schwarz inequality).
- **Ch. 2**: 1 (induction formulas), 13 ($\sqrt 3$, $\sqrt 5$, $\sqrt 6$ irrational), 19 (Bernoulli's inequality $(1+h)^n \ge 1 + nh$).

### Conclusion

Twelve properties give all of school algebra and every rule for inequalities, including the triangle inequality, which is the main tool for the ε–δ arguments starting in Week 2. But the same twelve properties hold in $\mathbb{Q}$, where $x^2 = 2$ has no solution, so the real numbers need one more axiom before the hard theorems about continuous functions can be proved.

## Related

- [[Calc I, Lecture 02: Functions]]
- [[Calc I, Lecture 05: The Epsilon-Delta Definition of a Limit]]
- [[Calc I, Lecture 11: Extreme Values and Least Upper Bounds]]
