---
id: L-0013
title: "Calc I, Lecture 09: Continuity"
course: Calculus I
lecture: 9
week: 3
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 6 (Continuous Functions)"
summary: Continuity at a point, the ways it can fail, why sums, products, quotients and compositions of continuous functions are continuous, continuity on intervals, and the local sign-preservation theorem.
---

A function is **continuous at $a$** when $\lim_{x\to a} f(x) = f(a)$: the limit exists, $f(a)$ exists, and they agree. Continuity is preserved by **sums, products, quotients** (where defined) and **composition**, so almost every function we can write down is continuous on its domain. One small theorem, **continuous and positive at a point implies positive nearby**, is the bridge to next week's big theorems. Here's how it works:

### 1. The Definition

> [!definition] Continuity (Spivak Ch. 6)
> $f$ is **continuous at $a$** if $\displaystyle\lim_{x\to a} f(x) = f(a)$.

In ε–δ form: for every $\varepsilon > 0$ there is $\delta > 0$ such that $|x - a| < \delta \Rightarrow |f(x) - f(a)| < \varepsilon$. Notice **the "$0 <$" can be dropped** here, since at $x = a$ the conclusion $|f(a) - f(a)| < \varepsilon$ is automatic.

**Three ways to fail** (Spivak's Figures 1–3):
1. $f(a)$ isn't defined.
2. $\lim_{x\to a} f(x)$ doesn't exist.
3. Both exist but $\lim_{x\to a} f(x) \ne f(a)$.

Intuition: "no breaks, jumps, or wild oscillations"; "draw without lifting the pencil". But that's too optimistic: $x\sin(1/x)$ (with value $0$ at $0$) is continuous and you definitely can't draw it.

### 2. Examples

- **Constants, $x$, $x^2$**: continuous everywhere (we proved the limits in Lecture 5).
- **$x \sin(1/x)$**: not defined at $0$, but if we define $G(0) = 0$ we get a continuous function (we **must** pick $0$, since that's the limit). This is a **removable** discontinuity (Problem 6-16).
- **$\sin(1/x)$**: no choice of $F(0)$ makes it continuous, since the limit doesn't exist.
- **$f(x) = x$ on $\mathbb{Q}$, $0$ off $\mathbb{Q}$**: continuous at exactly one point, $0$.
- **Thomae's function** ($1/q$ at $p/q$, $0$ at irrationals): the limit is $0$ everywhere (Lecture 5), so it's **continuous at every irrational and discontinuous at every rational**. Wild.

### 3. Continuity Is Preserved by the Operations

> [!theorem] Spivak Theorem 6-1
> If $f$ and $g$ are continuous at $a$, then so are $f + g$ and $f \cdot g$; and if $g(a) \ne 0$, so is $1/g$.

Proof: the limit laws. E.g. $\lim (f+g)(x) = f(a) + g(a) = (f+g)(a)$.

**Consequence:** every polynomial is continuous everywhere, and every rational function is continuous at every point of its domain. Assuming (for now) $\sin$ and $\cos$ are continuous, so is everything built from them with $+, \cdot, /$.

But $\sin(x^2)$ needs **composition**:

> [!theorem] Spivak Theorem 6-2
> If $g$ is continuous at $a$ and $f$ is continuous at $g(a)$, then $f \circ g$ is continuous at $a$.

> [!proof]
> Let $\varepsilon > 0$. Since $f$ is continuous at $g(a)$, there's $\delta' > 0$ with
> $$|y - g(a)| < \delta' \Rightarrow |f(y) - f(g(a))| < \varepsilon.$$
> Now treat $\delta'$ as the "ε" for $g$: since $g$ is continuous at $a$, there's $\delta > 0$ with
> $$|x - a| < \delta \Rightarrow |g(x) - g(a)| < \delta'.$$
> Chain them: $|x - a| < \delta \Rightarrow |f(g(x)) - f(g(a))| < \varepsilon$.

Note that $f$ has to be continuous at $g(a)$, **not at $a$**. The neat move in the proof is using $\delta'$ as the $\varepsilon$ in the second definition.

Related fact (Problem 6-12): if $f$ is continuous at $l$ and $\lim_{x\to a} g(x) = l$, then $\lim_{x\to a} f(g(x)) = f(l)$, so you can **pull limits inside continuous functions**. E.g. $\lim_{x\to0}\sqrt{1 + x} = \sqrt{1} = 1$, once we know $\sqrt{\ }$ is continuous.

### 4. Continuity on an Interval

> [!definition]
> $f$ is **continuous on $(a, b)$** if it's continuous at every point of $(a, b)$. It is **continuous on $[a, b]$** if, in addition, $\lim_{x\to a^+} f(x) = f(a)$ and $\lim_{x\to b^-} f(x) = f(b)$.

(One-sided at the endpoints, because $f$ might not be defined outside $[a, b]$, e.g. $\sqrt{1 - x^2}$ on $[-1, 1]$.)

### 5. The Bridge Theorem

> [!theorem] Spivak Theorem 6-3
> Suppose $f$ is continuous at $a$ and $f(a) > 0$. Then there is $\delta > 0$ such that $f(x) > 0$ for all $x$ with $|x - a| < \delta$. (Same with $<$.)

> [!proof]
> Use the definition with $\varepsilon = f(a)$: there's $\delta$ with $|x - a| < \delta \Rightarrow |f(x) - f(a)| < f(a)$, i.e. $0 < f(x) < 2f(a)$.

This is a **local → neighbourhood** statement: information at one point gives information on a whole interval. It's the key lemma for the proof of the Intermediate Value Theorem (Lecture 11) and for $1/g$ being defined near $a$ in the quotient rule (Lecture 15).

### 6. Worked Examples

1. **Choose $c$ so that $f(x) = x^2$ for $x < 1$, $f(x) = cx + 2$ for $x \ge 1$ is continuous.** Left limit at $1$ is $1$; right limit and value is $c + 2$. Need $c + 2 = 1$: $c = -1$.
2. **Where is $\dfrac{x^2 - 4}{x - 2}$ continuous?** Everywhere except $2$ (not in the domain). Defining $f(2) = 4$ removes the discontinuity.
3. **Is $f(x) = \sin\!\big(x^2 + \sin(x + \sin^2(x^3))\big)$ continuous?** Yes, everywhere: compositions, sums and products of continuous functions (Theorems 6-1, 6-2).
4. **If $|f(x)| \le |x|$ for all $x$, is $f$ continuous at $0$?** Yes (Problem 6-3): $f(0) = 0$ is forced, and $|f(x) - 0| \le |x| < \varepsilon$ when $|x| < \varepsilon$.

### 7. Problems to Try

- **Ch. 6**: 1 (which functions extend continuously), 2, 3, 4 (continuous $|f|$ with nowhere-continuous $f$), 5 (continuous at exactly one point), 10, 11 (prove 6-1(3) via 6-2), 14 (gluing continuous pieces), 16 (removable discontinuities).

### Conclusion

Continuity is "the limit equals the value". Because the limit laws and composition preserve it, essentially every formula-defined function is continuous on its domain, and the pathological examples show the definition is subtle. Theorem 6-3, positivity persisting near a point, is the small lemma the big theorems of Week 4 are built on.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 08: The Squeeze Theorem and sin x over x]]
- [[Calc I, Lecture 10: The Intermediate Value Theorem]]
- [[Calc I, Lecture 13: Differentiability and Higher Derivatives]]
