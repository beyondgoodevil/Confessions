---
id: L-0033
title: "Calc I, Lecture 29: Curve Sketching"
course: Calculus I
lecture: 29
week: 10
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 11 (graph-sketching method) and Ch. 11 Appendix"
summary: Spivak's checklist for sketching a graph from f and f', the extra information from f'', and fully worked sketches of a quartic, a rational function with an oblique asymptote, and x e^{-x}.
---

With $f'$ and $f''$ we can sketch a graph from **a handful of computed facts** instead of plotting hundreds of points: where $f$ increases and decreases, where it bends, where it blows up, and what it does far out. Spivak gives a **checklist**, and the main skill is fitting the pieces together, since usually there's only one way they fit. Here's how it works:

### 1. The Checklist

From Spivak's text, plus concavity from the appendix:

1. **Domain**, and **symmetry**: check even/odd first, which can halve the work.
2. **Critical points** of $f$ (solve $f' = 0$) and **critical values**.
3. **Sign of $f'$** between critical points (and on either side of points where $f$ is undefined): increasing/decreasing, local max/min.
4. **Zeros of $f$**, if you can find them.
5. **Behaviour as $x \to \pm\infty$** (horizontal or oblique asymptotes) and **near points where $f$ isn't defined** (vertical asymptotes).
6. **Sign of $f''$**: convex/concave and inflection points. This keeps the sketch from bending the wrong way.

Spivak's point: a polynomial of degree $n$ has at most $n - 1$ critical points and so at most $n$ monotone pieces. The critical values alone often force the shape.

### 2. Example: $f(x) = x^4 - 2x^2$

1. **Even**: symmetric about the $y$-axis.
2. $f'(x) = 4x^3 - 4x = 4x(x - 1)(x + 1)$: critical points $-1, 0, 1$; values $-1, 0, -1$.
3. Signs of $f'$: $-$ on $(-\infty, -1)$, $+$ on $(-1, 0)$, $-$ on $(0, 1)$, $+$ on $(1, \infty)$. **Local mins at $\pm1$ (value $-1$), local max at $0$ (value $0$).**
4. Zeros: $x^2(x^2 - 2) = 0$, so $x = 0, \pm\sqrt2$.
5. $f(x) \to \infty$ as $x \to \pm\infty$ (leading term $x^4$).
6. $f''(x) = 12x^2 - 4$: concave on $|x| < \frac{1}{\sqrt3}$, convex outside. **Inflections at $\pm\frac1{\sqrt3}$**, value $\frac19 - \frac23 = -\frac59$.

Result: a "W" with bottoms at $(\pm1, -1)$, a bump at the origin, and crossings at $\pm\sqrt2$.

### 3. Example: $f(x) = \dfrac{x^2 - 2x + 2}{x - 1}$ (Spivak's)

1. Domain: $x \ne 1$.
2. Quotient rule: $f'(x) = \dfrac{(x - 1)(2x - 2) - (x^2 - 2x + 2)}{(x - 1)^2} = \dfrac{x(x - 2)}{(x - 1)^2}$. Critical points $0$ and $2$, with $f(0) = -2$ and $f(2) = 2$.
3. The sign of $f'$ is the sign of $x(x - 2)$: $+$ for $x < 0$, $-$ on $(0, 1)$ **and** $(1, 2)$, $+$ for $x > 2$. **Local max $-2$ at $0$, local min $2$ at $2$.** (Yes, the local max is lower than the local min. They're on different branches.)
4. Zeros: $x^2 - 2x + 2 = (x - 1)^2 + 1 > 0$, so **none**.
5. **Long division**: $f(x) = x - 1 + \dfrac{1}{x - 1}$. So as $x \to \pm\infty$, $f(x) - (x - 1) \to 0$: an **oblique asymptote $y = x - 1$**, approached from above for large $x$ and from below for large negative $x$. Near $1$: $f \to +\infty$ as $x \to 1^+$ and $-\infty$ as $x \to 1^-$, a **vertical asymptote**.
6. $f''(x) = \dfrac{2}{(x - 1)^3}$: convex for $x > 1$, concave for $x < 1$. No inflection points (the sign change happens where $f$ is undefined).

Spivak's afterthought: $f(x) = (x - 1) + \frac{1}{x - 1}$ is just the odd function $u + \frac1u$ shifted one unit right and one unit down, which explains the symmetry of the picture. Notice that only **after** the sketch is done, not before.

### 4. Example: $f(x) = xe^{-x}$

1. Domain $\mathbb{R}$; no symmetry.
2. $f'(x) = (1 - x)e^{-x}$: critical point $1$, value $1/e$.
3. $f' > 0$ for $x < 1$, $< 0$ for $x > 1$: **global max $1/e$ at $x = 1$**.
4. Zero only at $x = 0$.
5. $x \to \infty$: $\frac{x}{e^x} \to 0$ (exp beats polynomials, Theorem 18-6), so there's a **horizontal asymptote $y = 0$** on the right. As $x \to -\infty$: $f \to -\infty$.
6. $f''(x) = (x - 2)e^{-x}$: concave on $(-\infty, 2)$, convex on $(2, \infty)$, **inflection at $(2, 2/e^2)$**.

### 5. Rational Functions in General

(Spivak's Problem 11-22 asks you to describe them.) The things to check are the **vertical asymptotes** at zeros of the denominator that aren't cancelled, the **horizontal asymptote** if $\deg p \le \deg q$, and the **oblique asymptote** if $\deg p = \deg q + 1$ (found by long division). Between asymptotes, analyze each branch separately.

### 6. Problems to Try

- **Ch. 11**: 2 (sketch the functions from Problem 1), 3 ($x + \frac1x$, $x + \frac{3}{x^2}$, $\frac{x^2}{x^2 - 1}$, $\frac{1}{1 + x^2}$), 20 and 21 (reconstruct a polynomial's graph from critical data), 22.
- **Ch. 11 Appendix**: 1 (add convexity to the sketches from Problem 11-1).
- **Ch. 18**: 15 (graph $e^x/x^n$).

### Conclusion

A good sketch comes from the checklist: symmetry, critical points and the sign of $f'$, zeros, asymptotes (vertical, horizontal, oblique), then the sign of $f''$. Each item is a small computation, and together they leave essentially one possible picture. Odd features like a local max sitting below a local min are explained by asymptotes splitting the domain into branches.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 28: Concavity and the Second Derivative]]
- [[Calc I, Lecture 30: L'Hopital's Rule]]
- [[Calc I, Lecture 07: One-Sided Limits and Limits at Infinity]]
