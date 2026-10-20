---
id: L-0014
title: "Calc I, Lecture 11: Extreme Values and Least Upper Bounds"
course: Calculus I
lecture: 11
week: 4
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 7 (Theorems 2, 3) and Ch. 8 (Least Upper Bounds)"
summary: Continuous functions on closed intervals are bounded and attain a max and min; the least upper bound property P13 is the missing axiom, and with it the IVT, boundedness and the Archimedean property are proved.
---

The other two "hard theorems": a function continuous on $[a, b]$ is **bounded**, and it actually **attains a maximum and a minimum** (the **Extreme Value Theorem**). These, and the IVT, can't be proved from P1–P12. The missing axiom is the **least upper bound property (P13)**: every nonempty set of reals that is bounded above has a **least** upper bound. Here's how it works:

### 1. The Statements

> [!theorem] Spivak Theorem 7-2 (Boundedness)
> If $f$ is continuous on $[a, b]$, then $f$ is bounded above on $[a, b]$: there is $N$ with $f(x) \le N$ for all $x \in [a, b]$.

> [!theorem] Spivak Theorem 7-3 (Extreme Value Theorem)
> If $f$ is continuous on $[a, b]$, then there is $y \in [a, b]$ with $f(y) \ge f(x)$ for all $x \in [a, b]$. (Applying it to $-f$ gives a minimum, Theorem 7-7.)

**Counterexamples showing every hypothesis is needed:**
- $f(x) = 1/x$ for $x \ne 0$, $f(0) = 0$ on $[0, 1]$: one bad point, **unbounded** ($f(1/2N) = 2N$).
- Same function on the **open** interval $(0, 1)$: continuous there, still unbounded. So "closed" matters.
- $f(x) = x^2$ for $x < 1$, $f(x) = 0$ for $x \ge 1$ on $[0, 1]$: bounded, but **no max** (values get close to $1$, never reach it). So 7-3 is strictly stronger than 7-2.

### 2. Upper Bounds and Suprema

> [!definition] Upper bound, least upper bound
> $A \subseteq \mathbb{R}$ is **bounded above** if some $x$ satisfies $x \ge a$ for all $a \in A$ (an **upper bound**). A number $x$ is a **least upper bound** of $A$ if (1) $x$ is an upper bound, and (2) $x \le y$ for every upper bound $y$.

- The least upper bound is **unique** (two of them are each $\le$ the other), so we write $\sup A$. Similarly the **greatest lower bound** is $\inf A$.
- $\sup\{x : 0 \le x < 1\} = 1$, which is **not in the set**. The sup needn't be a max.
- **Working form of "$\alpha = \sup A$"**: $\alpha$ is an upper bound, and for every $\varepsilon > 0$ there's some $a \in A$ with $a > \alpha - \varepsilon$ (otherwise $\alpha - \varepsilon$ would be a smaller upper bound).

> [!definition] (P13) The least upper bound property
> If $A \ne \varnothing$ and $A$ is bounded above, then $A$ has a least upper bound.

Why the hypotheses: $\varnothing$ is bounded above by *everything*, so it has no *least* upper bound. **$\mathbb{Q}$ fails P13**: $\{x \in \mathbb{Q} : x^2 < 2\}$ has no least rational upper bound. P13 is exactly what separates $\mathbb{R}$ from $\mathbb{Q}$.

### 3. Proof of the IVT

> [!proof] Theorem 7-1 from P13
> Let $f$ be continuous on $[a, b]$ with $f(a) < 0 < f(b)$. Let
> $$A = \{x \in [a, b] : f \text{ is negative on } [a, x]\}.$$
> $A \ne \varnothing$ ($a \in A$) and $A$ is bounded above by $b$, so $\alpha = \sup A$ exists. By continuity at the endpoints (Problem 6-15) $f$ is negative on some $[a, a + \delta)$ and positive on some $(b - \delta, b]$, so $a < \alpha < b$. Now rule out the two bad cases:
> - **If $f(\alpha) < 0$**: by Theorem 6-3, $f < 0$ on some $(\alpha - \delta, \alpha + \delta)$. There's $x_0 \in A$ with $\alpha - \delta < x_0 < \alpha$, so $f < 0$ on $[a, x_0]$ and on $[x_0, x_1]$ for any $x_1 \in (\alpha, \alpha + \delta)$. Then $x_1 \in A$ with $x_1 > \alpha$, which contradicts $\alpha$ being an upper bound.
> - **If $f(\alpha) > 0$**: $f > 0$ on some $(\alpha - \delta, \alpha + \delta)$. But some $x_0 \in A$ lies in $(\alpha - \delta, \alpha)$, so $f(x_0) < 0$. Contradiction.
>
> So $f(\alpha) = 0$.

The idea: $\alpha$ is "the first place $f$ stops being negative". Without P13 there's no guarantee such a point exists.

### 4. Proof Sketches for Boundedness and the Max

**Local boundedness (Theorem 8-1):** continuous at $a$ ⇒ bounded on some $(a - \delta, a + \delta)$. Use $\varepsilon = 1$: $f(x) < f(a) + 1$ there.

**Theorem 7-2:** same shape as the IVT proof. Let $A = \{x \in [a,b] : f \text{ bounded above on } [a, x]\}$ and $\alpha = \sup A$. Local boundedness at $\alpha$ lets you push past $\alpha$ if $\alpha < b$, which is a contradiction, so $\alpha = b$. One more local-boundedness step at $b$ finishes.

**Theorem 7-3 (the trick):** let $\alpha = \sup\{f(x) : x \in [a, b]\}$ (exists by 7-2 and P13). If $f$ **never** equals $\alpha$, then
$$g(x) = \frac{1}{\alpha - f(x)}$$
is continuous on $[a, b]$. But $f(x)$ gets within any $\varepsilon$ of $\alpha$, so $g$ gets bigger than any $1/\varepsilon$. Then $g$ is unbounded, which contradicts 7-2. So $f(y) = \alpha$ for some $y$.

### 5. The Archimedean Property

Even "$\mathbb{N}$ is unbounded" needs P13! (It's not a consequence of P1–P12.)

> [!theorem] Spivak Theorems 8-2, 8-3
> $\mathbb{N}$ is not bounded above. Equivalently, for every $\varepsilon > 0$ there's $n \in \mathbb{N}$ with $1/n < \varepsilon$.

> [!proof]
> If $\alpha = \sup \mathbb{N}$ existed, then $n + 1 \le \alpha$ for all $n$, so $n \le \alpha - 1$ for all $n$, and $\alpha - 1$ would be a smaller upper bound.

We quietly used "$1/n < \varepsilon$ for large $n$" back in Lecture 5 (Thomae's function, $\sin(1/x)$). Now it's justified. Spivak's line on this is that after this point there are no more lies.

### 6. Worked Examples

1. $\sup\{1 - 1/n : n \in \mathbb{N}\} = 1$ (not attained); $\inf = 0$ (attained at $n = 1$).
2. $\sup\{x : x^2 < 2\} = \sqrt2$. This is one way to *construct* $\sqrt2$ from P13 alone.
3. **Max/min of $x^3 - x$ on $[-1, 2]$**: exists by the EVT. *Finding* it is Lecture 25's job (answer: max $6$ at $x = 2$, min $-\frac{2}{3\sqrt3}$ at $x = 1/\sqrt3$).
4. **Between any two reals there's a rational** (Problem 8-5/8-6): if $x < y$, pick $n$ with $1/n < y - x$ (Archimedean); some $m/n$ lands in $(x, y)$.

### 7. Problems to Try

- **Ch. 7**: 1 (bounded? attains max/min?), 6.
- **Ch. 8**: 1 (find sups and infs), 2 ($\inf A = -\sup(-A)$), 5 and 6 (density of $\mathbb{Q}$), 15 and 16 (bisection proofs of the IVT and boundedness).

### Conclusion

Boundedness and the Extreme Value Theorem complete the three hard theorems. All three need the least upper bound property, which is the one axiom that distinguishes $\mathbb{R}$ from $\mathbb{Q}$. With P13 in hand, the IVT proof is "take the sup of where $f$ is still negative", and even the Archimedean property needs it. The EVT is what makes optimization (Lecture 25) possible: it guarantees there **is** a max to look for.

## Related

- [[Calc I, Lecture 10: The Intermediate Value Theorem]]
- [[Calc I, Lecture 12: The Derivative]]
- [[Calc I, Lecture 25: Maxima, Minima and Critical Points]]
- [[Calc I, Lecture 35: The Definite Integral]]
