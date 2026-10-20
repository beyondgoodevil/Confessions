---
id: L-0014
title: "Calc I, Lecture 10: The Intermediate Value Theorem"
course: Calculus I
lecture: 10
week: 4
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 7 (Three Hard Theorems), Theorems 1, 4, 5, 8, 9"
summary: A continuous function on a closed interval takes every value in between; why each hypothesis matters; existence of square roots, roots of odd-degree polynomials, and fixed points.
---

The **Intermediate Value Theorem (IVT)** says that a function continuous on $[a, b]$ takes on **every value between $f(a)$ and $f(b)$**. In particular, if it starts negative and ends positive, it must hit zero. It's the first of Spivak's **"three hard theorems"**, the first results about continuity on a **whole interval** rather than at a point. Today is the statement, consequences and counterexamples; the proof needs a new axiom and comes in Lecture 11. Here's how it works:

### 1. The Statement

> [!theorem] Spivak Theorem 7-1
> If $f$ is continuous on $[a, b]$ and $f(a) < 0 < f(b)$, then there is some $x$ in $[a, b]$ with $f(x) = 0$.

> [!theorem] Intermediate Value Theorem (Theorems 7-4, 7-5)
> If $f$ is continuous on $[a, b]$ and $c$ is any number between $f(a)$ and $f(b)$, then $f(x) = c$ for some $x \in [a, b]$.

> [!proof] From 7-1
> If $f(a) < c < f(b)$, apply 7-1 to $g = f - c$, which is continuous with $g(a) < 0 < g(b)$. If $f(a) > c > f(b)$, apply that to $-f$ and $-c$.

Applying this on subintervals $[c, d] \subseteq [a, b]$: **a continuous function on an interval that takes two values takes every value in between.**

### 2. Every Hypothesis Matters

These theorems are **global**, and continuity failing at even **one** point can wreck the conclusion:

- Spivak's example: on $[0, 2]$ let $f(x) = -1$ for $0 \le x < \sqrt2$ and $f(x) = 1$ for $\sqrt2 \le x \le 2$. Then $f(0) < 0 < f(2)$ but $f$ is never $0$. Only one discontinuity, but it's fatal.
- **Over $\mathbb{Q}$ the IVT is false**: $f(x) = x^2 - 2$ on the rationals in $[0, 2]$ goes from $-2$ to $2$ but never hits $0$, because $\sqrt2 \notin \mathbb{Q}$. So the IVT **can't** follow from P1–P12 (which hold in $\mathbb{Q}$). This is why the proof has to wait for the least upper bound property.

### 3. Consequences

> [!theorem] Square roots exist (Spivak Theorem 7-8)
> If $\alpha > 0$, there is $x$ with $x^2 = \alpha$.

> [!proof]
> $f(x) = x^2$ is continuous. Pick $b$ with $b^2 > \alpha$ ($b = \alpha$ if $\alpha > 1$, $b = 1$ if $\alpha \le 1$). Then $f(0) = 0 < \alpha < f(b)$, so by the IVT $f(x) = \alpha$ for some $x \in [0, b]$.

Same argument: every positive number has an $n$th root; for **odd** $n$, every number does.

> [!theorem] Odd-degree polynomials have roots (Spivak Theorem 7-9)
> If $n$ is odd, $x^n + a_{n-1}x^{n-1} + \cdots + a_0 = 0$ has a root.

> [!proof]
> Write $f(x) = x^n\left(1 + \dfrac{a_{n-1}}{x} + \cdots + \dfrac{a_0}{x^n}\right)$. If $|x| > \max(1, 2n|a_{n-1}|, \ldots, 2n|a_0|)$, then each $\left|\dfrac{a_{n-k}}{x^k}\right| \le \dfrac{|a_{n-k}|}{|x|} < \dfrac{1}{2n}$, so the bracket is between $\tfrac12$ and $\tfrac32$; in particular it's **positive**. So for such $x$, $f(x)$ has the sign of $x^n$: positive for a large positive $x_1$, negative for a large negative $x_2$ ($n$ odd). The IVT on $[x_2, x_1]$ gives a root.

**Key idea:** for large $|x|$ the leading term dominates. We'll keep using this.

(Even degree is different: $x^2 + 1$ has no root. Spivak's Theorem 7-10/7-11 shows instead that an even-degree polynomial has a **minimum** $m$ and takes exactly the values $\ge m$. That one uses the Extreme Value Theorem from Lecture 11.)

### 4. Worked Examples

1. **$x^5 - x - 1 = 0$ has a root between $1$ and $2$.** $f(1) = -1 < 0$, $f(2) = 29 > 0$, $f$ continuous. Repeated halving (**bisection**, Problem 8-15) narrows it down: $f(1.5) \approx 5.09 > 0$, $f(1.25) \approx 0.80 > 0$, $f(1.125) \approx -0.32 < 0$, so the root is in $(1.125, 1.25)$, and so on.
2. **Fixed points** (Problem 7-11): if $f: [0, 1] \to [0, 1]$ is continuous, then $f(x) = x$ for some $x$. Apply the IVT to $g(x) = f(x) - x$: $g(0) = f(0) \ge 0$ and $g(1) = f(1) - 1 \le 0$.
3. **Crossing graphs** (Problem 7-10): if $f, g$ are continuous on $[a, b]$ with $f(a) < g(a)$ and $f(b) > g(b)$, then $f(x) = g(x)$ somewhere: apply 7-1 to $f - g$.
4. **A continuous function that only takes rational values is constant** (Problem 7-5): if it took two different values, it would take every value in between, including irrational ones.

### 5. Problems to Try

- **Ch. 7**: 2 (locate roots between consecutive integers), 3 (equations with solutions), 5, 10, 11, 13(a) ($\sin(1/x)$ with $f(0) = 0$ satisfies the IVT conclusion but isn't continuous, so the converse fails).
- **Ch. 8**: 15 (bisection proof of the IVT, once you've seen Lecture 11).

### Conclusion

The IVT turns "continuous on an interval" into "takes every value in between". That immediately gives square roots, roots of odd-degree polynomials, and fixed points. It fails over $\mathbb{Q}$, so it depends on a property of $\mathbb{R}$ we haven't stated yet. Stating that property and using it is next lecture.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 09: Continuity]]
- [[Calc I, Lecture 11: Extreme Values and Least Upper Bounds]]
- [[Calc I, Lecture 32: Newton's Method]]
