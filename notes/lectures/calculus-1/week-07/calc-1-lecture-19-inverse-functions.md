---
id: L-0023
title: "Calc I, Lecture 19: Inverse Functions and Their Derivatives"
course: Calculus I
lecture: 19
week: 7
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 12 (Inverse Functions), Theorems 1-5"
summary: One-one functions and inverses as sets of pairs, reflection in y = x, why continuous one-one functions are monotone, continuity and differentiability of inverses, the formula 1/f'(f^{-1}(b)), and the power rule for rational exponents.
---

A function has an **inverse** $f^{-1}$ exactly when it's **one-one**. On an interval, a continuous one-one function is automatically **increasing or decreasing**, its inverse is **continuous**, and wherever $f' \ne 0$ the inverse is **differentiable** with
$$(f^{-1})'(b) = \frac{1}{f'(f^{-1}(b))}.$$
This is what turns "implicit differentiation assumes the derivative exists" into a theorem, and it's how $\sqrt[n]{x}$, $\arcsin$, $\arctan$ and $\log$/$\exp$ get their derivatives. Here's how it works:

### 1. One-One Functions and Inverses

> [!definition] One-one, inverse
> $f$ is **one-one** if $f(a) \ne f(b)$ whenever $a \ne b$. The **inverse** $f^{-1}$ is the set of all pairs $(a, b)$ for which $(b, a)$ is in $f$.

> [!theorem] Spivak Theorem 12-1
> $f^{-1}$ is a function iff $f$ is one-one.

So $f^{-1}(f(x)) = x$ and $f(f^{-1}(y)) = y$. Since we flipped the pairs, the graph of $f^{-1}$ is the **reflection of the graph of $f$ in the line $y = x$**. In terms of graphs, one-one is the **horizontal line test**.

- $x^2$ isn't one-one on $\mathbb{R}$, but it is on $[0, \infty)$, and the inverse there is $\sqrt x$.
- $x^n$ is one-one on $[0, \infty)$, and on all of $\mathbb{R}$ if $n$ is odd; the inverses are $\sqrt[n]{x}$.
- Any **increasing** (or decreasing) function is one-one.

### 2. Continuous + One-One ⇒ Monotone

> [!theorem] Spivak Theorem 12-2
> If $f$ is continuous and one-one on an interval, then $f$ is increasing or decreasing on that interval.

Idea: if $f$ went up then down, then by the IVT it would hit some value twice. Spivak gives a slick proof: slide a pair $a_0 < b_0$ continuously to any other pair $a_1 < b_1$ via $x_t = (1-t)a_0 + ta_1$, $y_t = (1-t)b_0 + tb_1$. The quantity $f(y_t) - f(x_t)$ is continuous in $t$ and never $0$ (one-one), so by the IVT it keeps its sign.

### 3. Continuity of the Inverse

> [!theorem] Spivak Theorem 12-3
> If $f$ is continuous and one-one on an interval, then $f^{-1}$ is continuous.

Proof idea (for increasing $f$): to get $f^{-1}(x)$ within $\varepsilon$ of $a$, it suffices to keep $x$ strictly between $f(a - \varepsilon)$ and $f(a + \varepsilon)$, and that interval contains $f(a)$ with room to spare. Graphically, look at the picture sideways.

### 4. Differentiability of the Inverse

**Where it fails** (Theorem 12-4): if $f'(f^{-1}(a)) = 0$, then $f^{-1}$ is **not** differentiable at $a$. Otherwise differentiating $f(f^{-1}(x)) = x$ by the chain rule would give $0\cdot(f^{-1})'(a) = 1$. Example: $f(x) = x^3$, $f'(0) = 0$, so $\sqrt[3]{x}$ isn't differentiable at $0$ (vertical tangent, Lecture 13).

> [!theorem] Spivak Theorem 12-5
> Let $f$ be continuous and one-one on an interval, and differentiable at $f^{-1}(b)$ with $f'(f^{-1}(b)) \ne 0$. Then $f^{-1}$ is differentiable at $b$ and
> $$(f^{-1})'(b) = \frac{1}{f'(f^{-1}(b))}.$$

> [!proof] Sketch
> Let $b = f(a)$ and write $b + h = f(a + k)$, so $k = f^{-1}(b + h) - f^{-1}(b)$. Then
> $$\frac{f^{-1}(b + h) - f^{-1}(b)}{h} = \frac{k}{f(a + k) - f(a)}.$$
> By Theorem 12-3, $f^{-1}$ is continuous, so $k \to 0$ as $h \to 0$ (and $k \ne 0$ when $h \ne 0$, by one-one-ness). So the quotient $\to \dfrac{1}{f'(a)}$.

**The way to remember it:** differentiate $f(f^{-1}(x)) = x$ to get $f'(f^{-1}(x))\cdot(f^{-1})'(x) = 1$. Theorem 12-5 is what makes this legitimate. In Leibniz notation it reads $\dfrac{dx}{dy} = \dfrac{1}{dy/dx}$ (Problem 12-17).

### 5. Rational Exponents

With $f_n(x) = x^n$ (on $[0, \infty)$ for even $n$), $g_n = f_n^{-1}$ is $x^{1/n}$ and for $x \ne 0$:
$$g_n'(x) = \frac{1}{n\,(x^{1/n})^{n-1}} = \frac1n x^{\frac1n - 1}.$$
Then for $a = m/n$, $x^{m/n} = (x^{1/n})^m$ and the chain rule gives $(x^{m/n})' = \tfrac mn x^{\frac mn - 1}$. So **the power rule holds for all rational exponents.** Irrational exponents have to wait until we can even define $x^{\sqrt2}$ (Lecture 22).

### 6. Worked Examples

1. **$f(x) = x^3 + x$; find $(f^{-1})'(2)$.** $f$ is increasing ($f' = 3x^2 + 1 > 0$), and $f(1) = 2$, so $(f^{-1})'(2) = \dfrac{1}{f'(1)} = \dfrac14$. We never needed a formula for $f^{-1}$.
2. **Problem 12-19**: $h'(x) = \sin^2(\sin(x + 1))$ and $h(0) = 3$. Then $(h^{-1})'(3) = \dfrac{1}{h'(0)} = \dfrac{1}{\sin^2(\sin 1)}$.
3. **Problem 12-8**: if $f'(x) = (1 + x^3)^{-1/2}$ and $g = f^{-1}$, then $g' = \dfrac{1}{f'(g)} = (1 + g^3)^{1/2}$, and differentiating again, $g'' = \tfrac12(1 + g^3)^{-1/2}\cdot 3g^2 g' = \tfrac32 g^2$.
4. **$f(x) = \dfrac{ax + b}{cx + d}$ is one-one iff $ad - bc \ne 0$** (Problem 12-6). Solving $y = \frac{ax + b}{cx + d}$ for $x$ gives $f^{-1}(y) = \dfrac{dy - b}{a - cy}$.
5. $\dfrac{d}{dx}x^{2/3} = \dfrac23 x^{-1/3}$, not differentiable at $0$ (cusp).

### 7. Problems to Try

- **Ch. 12**: 1 (find inverses), 3 (inverse of increasing is increasing), 5 ($(f\circ g)^{-1} = g^{-1}\circ f^{-1}$), 7 (where is it one-one?), 8, 19, 20 (a formula for $(f^{-1})''$), 22.

### Conclusion

An inverse exists iff $f$ is one-one. On an interval, continuity forces monotonicity and makes the inverse continuous, and wherever $f' \ne 0$ the inverse has derivative $1/f'(f^{-1}(b))$. That proves the power rule for rational exponents and sets up $\arcsin$, $\arctan$ and, crucially, $\exp$ as the inverse of $\log$.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 18: Implicit Differentiation]]
- [[Calc I, Lecture 20: Inverse Trigonometric Functions]]
- [[Calc I, Lecture 21: The Exponential and Logarithm Functions]]
