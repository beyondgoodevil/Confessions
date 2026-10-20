---
id: L-0035
title: "Calc I, Lecture 32: Newton's Method"
course: Calculus I
lecture: 32
week: 11
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 22 (Infinite Sequences), Problems 14-15; Ch. 11 Appendix (convexity)"
summary: Finding roots by repeatedly following tangent lines to the axis, why the iterates converge when f' and f'' are positive, the quadratic error estimate that doubles the number of correct digits, worked examples, and how the method fails.
---

**Newton's method** finds a root of $f$ by replacing $f$ with its **tangent line**, solving the linear equation, and repeating:
$$x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.$$
When it works it's spectacularly fast: the error roughly **squares** at each step, so the number of correct digits about **doubles**. Spivak develops it in Problem 22-14 using convexity, and also shows pictures of it failing. Here's how it works:

### 1. Where the Formula Comes From

The tangent line at $(x_0, f(x_0))$ is $y = f(x_0) + f'(x_0)(x - x_0)$. It meets the $x$-axis where $y = 0$:
$$x_1 = x_0 - \frac{f(x_0)}{f'(x_0)}$$
(Problem 22-14(a)). This is **linear approximation** (Lecture 24) used to solve an equation instead of to estimate a value. Now restart from $x_1$, and so on. That gives a sequence $\{x_n\}$, which we hope converges to a root $c$.

### 2. When It Works

> [!theorem] Problem 22-14(b)
> Suppose $f' > 0$ and $f'' > 0$ (increasing and convex), and $f(x_0) > 0$. Then $x_0 \ge x_1 \ge x_2 \ge \cdots \ge c$, where $f(c) = 0$.

Why, informally: convex means the graph lies **above** its tangent lines (Lecture 28), so each tangent hits the axis **before** the graph does but **to the right of** the root. Every iterate stays to the right of $c$ and moves left. A decreasing sequence bounded below converges (that's the least upper bound property again, Ch. 22), and the limit $L$ satisfies $L = L - \frac{f(L)}{f'(L)}$, so $f(L) = 0$.

> [!theorem] The error estimate (Problem 22-14(c), (d))
> Let $\varepsilon_k = x_k - c$. Then
> $$\varepsilon_{k+1} \le \frac{f''(\eta_k)}{f'(x_k)}\,\varepsilon_k^2$$
> for some $\eta_k$ between $c$ and $x_k$. So if $m = \inf f'$ and $M = \sup|f''|$ on $[c, x_1]$, then $\varepsilon_{k+1} \le \frac Mm\varepsilon_k^2$.

**The MVT does the work:** $f(x_k) = f(x_k) - f(c) = f'(\xi_k)\varepsilon_k$ for some $\xi_k \in (c, x_k)$, which gives
$$\varepsilon_{k+1} = \varepsilon_k - \frac{f(x_k)}{f'(x_k)} = \varepsilon_k\,\frac{f'(x_k) - f'(\xi_k)}{f'(x_k)},$$
and the MVT applied to $f'$ turns $f'(x_k) - f'(\xi_k)$ into $f''(\eta_k)(x_k - \xi_k)$, which is at most $f''(\eta_k)\varepsilon_k$.

**Quadratic convergence:** if $\frac Mm\varepsilon_k \approx 10^{-3}$, then $\varepsilon_{k+1} \lesssim 10^{-3}\varepsilon_k$. Error $10^{-3} \to 10^{-6} \to 10^{-12}$: **the digits double each step.**

### 3. Worked Examples

1. **$\sqrt2$** (Problem 22-14(e)): $f(x) = x^2 - 2$, so
$$x_{n+1} = x_n - \frac{x_n^2 - 2}{2x_n} = \frac12\left(x_n + \frac{2}{x_n}\right),$$
the ancient **Babylonian / Heron** method: average the guess with $2/\text{guess}$. From $x_0 = 1.4$:

| $n$ | $x_n$ |
|---|---|
| 0 | 1.4 |
| 1 | 1.4142857 |
| 2 | 1.4142136 |
| 3 | 1.4142136 |

Already correct to 7 decimals at $n = 2$.

2. **$x^3 + x - 1 = 0$ on $[0, 1]$** (Problem 22-15(iii)). $f'(x) = 3x^2 + 1$, start at $x_0 = 1$:

| $n$ | $x_n$ |
|---|---|
| 0 | 1 |
| 1 | 0.75 |
| 2 | 0.6860465 |
| 3 | 0.6823396 |
| 4 | 0.6823278 |

Errors: about $0.32$, $0.068$, $0.0037$, $0.000012$. Each one is roughly a constant times the square of the last.

3. **$\cos x = x$** ($f(x) = \cos x - x$, $f'(x) = -\sin x - 1$), from $x_0 = 1$: $0.7503639$, $0.7391129$, $0.7390851$, $0.7390851$. Compare **bisection** (Lecture 10), which gains only one binary digit per step.

### 4. How It Fails

1. **$f'(x_n) = 0$** (or tiny): the tangent is horizontal and $x_{n+1}$ is undefined or flung far away.
2. **Bad starting point**: the iterates can jump to a different root or wander off. The guarantee above needs the right convexity and a start on the correct side.
3. **Cycling or divergence**: for $f(x) = \sqrt[3]{x}$, $x_{n+1} = x_n - \frac{x_n^{1/3}}{\frac13x_n^{-2/3}} = -2x_n$, which **moves away** from the root $0$ every step. (Here $f'$ blows up at the root.)
4. **Multiple roots** ($f(c) = f'(c) = 0$): it still converges, but only **linearly**, which is slow.

Spivak's Figures 8 and 9 in Ch. 22 show two of these failure modes. Practical rule: get close with bisection or a sketch first, then switch to Newton.

### 5. Problems to Try

- **Ch. 22**: 14 (all parts: the formula, monotone convergence, the error estimate, $\sqrt A$), 15 (estimate zeros of $\tan x - \cos^2 x$, $\cos x - x^2$, $x^3 + x - 1$, $x^3 - 3x^2 + 1$).
- By hand: compute $\sqrt[3]{10}$ to 6 decimals, starting from $x_0 = 2$.

### Conclusion

Newton's method replaces $f$ by its tangent line and solves, over and over. When $f$ is increasing and convex near the root (or more generally when you start close enough), the iterates converge monotonically, and the MVT shows the error is squared at each step. It can fail through flat tangents, bad starts or roots where $f'$ misbehaves, so it works best after a rough location is known.

## Related

- [[Calc I, Lecture 24: Linear Approximation and Differentials]]
- [[Calc I, Lecture 10: The Intermediate Value Theorem]]
- [[Calc I, Lecture 33: Antiderivatives]]
