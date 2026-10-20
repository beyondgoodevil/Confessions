---
id: L-0007
title: "Calc I, Lecture 03: Graphs and the Basic Functions"
course: Calculus I
lecture: 3
week: 1
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 4 (Graphs)"
summary: The real line, intervals, the plane and distance, graphs of functions, lines and slope, the standard catalogue of graphs, and some functions that can't really be drawn.
---

The **graph** of $f$ is the set of points $(x, f(x))$ in the plane, so a graph is basically the function itself drawn on paper. This lecture sets up **intervals**, the **distance formula**, **lines and slope**, and the standard catalogue of graphs. It also gives a first look at functions like $\sin(1/x)$ whose graphs can't be drawn honestly, which is exactly where limits will be needed. Here's how it works:

### 1. The Line and Intervals

- Numbers are drawn as points on a line; $|a - b|$ is the **distance** between $a$ and $b$.
- $\{x : |x - a| < \varepsilon\}$ is the **open interval** $(a - \varepsilon, a + \varepsilon)$. This picture is the whole content of "$x$ is close to $a$".
- Notation: $(a, b) = \{a < x < b\}$, $[a, b] = \{a \le x \le b\}$, and the half-open versions; $(a, \infty) = \{x > a\}$. **Warning:** $\infty$ is not a number; it's just part of the symbol.

### 2. The Plane, Distance and Lines

> [!definition] Distance
> The distance between $(a, b)$ and $(c, d)$ is $\sqrt{(a - c)^2 + (b - d)^2}$.

This builds the Pythagorean theorem into the definition.

> [!definition] Graph
> The **graph** of $f$ is the set of all points $(x, f(x))$ for $x$ in the domain of $f$.

- **Vertical line test**: a set in the plane is the graph of a function iff no vertical line meets it twice. This is just the definition of function from Lecture 2 restated.
- $f(x) = c$: horizontal line. $f(x) = cx$: line through the origin (similar triangles). $f(x) = cx + d$: line with **slope** $c$ through $(0, d)$, which is why these are called **linear functions**.
- **Point–slope form** (Problem 4-6): the line through $(a, b)$ with slope $m$ is the graph of $f(x) = m(x - a) + b$. The **tangent line** in Lecture 12 will be exactly this with $m = f'(a)$.
- **Slope through two points** $(a, b), (c, d)$ with $a \ne c$: $m = \dfrac{d - b}{c - a}$. Vertical lines ($a = c$) are not graphs of functions at all.

### 3. The Standard Catalogue

1. **Powers** $x^n$: even $n$ look like the parabola $x^2$; odd $n$ like $x^3$. For $|x| < 1$, higher powers are **flatter** near $0$; for $|x| > 1$ they're steeper.
2. **Polynomials** of degree $n$: at most $n - 1$ "peaks and valleys" (proved properly with derivatives in Lecture 29).
3. **Rational functions** like $1/x$: blow up where the denominator vanishes; e.g. $1/x$ is a hyperbola rotated $45°$.
4. **$|x|$**: a "V" with a corner at $0$. This becomes the standard example of a **continuous but not differentiable** function in Lecture 13.
5. **Circle** of radius $r$ about $(a, b)$: $(x - a)^2 + (y - b)^2 = r^2$. **Not** a graph, but it's the union of the graphs of $y = b \pm \sqrt{r^2 - (x - a)^2}$.
6. **Ellipse** $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$ (sum of distances to two foci constant) and **hyperbola** $\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1$ (difference constant).
7. **$\sin$ and $\cos$**: periodic with period $2\pi$. For now we take their graphs on faith; the rigorous definition comes in Ch. 15 (Lecture 17).

### 4. Functions That Can't Be Drawn (Preview of Limits)

These are Spivak's favourite troublemakers, and they come back all semester:

- **$\sin(1/x)$**: as $x \to 0$, $1/x$ races through infinitely many periods, so the graph oscillates between $\pm 1$ infinitely often near $0$. **No limit at 0** (Lecture 5).
- **$x \sin(1/x)$**: same oscillation, but squeezed between the lines $y = \pm x$, so it **does** go to $0$ (Lecture 8).
- **$x^2 \sin(1/x)$**: squeezed between $\pm x^2$; it'll turn out to be **differentiable** at $0$ (Lecture 13).
- **The rationals indicator** ($1$ on $\mathbb{Q}$, $0$ off it): its graph is two "dotted lines", neither of them solid. This is the textbook example of a function with **no limit anywhere**.

> [!note] Why pictures aren't proofs
> No drawing distinguishes $f(x) = x^2$ for $x < 1$, $2$ for $x \ge 1$ from the same thing with $\le$, and no drawing really shows $\sin(1/x)$ near $0$. Graphs are for **intuition**; claims about functions get proved from definitions.

### 5. Worked Examples

1. **Line through $(1, 2)$ and $(3, 8)$**: slope $= \frac{8-2}{3-1} = 3$, so $f(x) = 3(x - 1) + 2 = 3x - 1$.
2. **Graph of $g(x) = f(x - c)$ vs. $f$**: shifted **right** by $c$. And $f(x) + c$ is shifted **up**; $f(cx)$ compresses horizontally by $c$ (Problem 4-14).
3. **The set $|x| + |y| = 1$** (Problem 4-4): split into quadrants; it's a square with vertices $(\pm1, 0), (0, \pm1)$.
4. **The parabola as a locus** (Problem 4-21): each point $(x, x^2)$ is the same distance from $(0, \tfrac14)$ as from the line $y = -\tfrac14$. Check: $x^2 + (x^2 - \tfrac14)^2 = (x^2 + \tfrac14)^2$.

### 6. Problems to Try

- **Ch. 4**: 1 (intervals), 3 and 4 (regions in the plane), 6 (point–slope form), 10 (sketching), 13 ($|x|$ vs. $x^2$, $|\sin x|$ vs. $\sin^2 x$), 14 (transformations), 17 (graphs involving $[x]$).

### Conclusion

A graph is the set of points $(x, f(x))$, and lines, powers, circles and conics give the standard picture library. The functions that can't be drawn, like $\sin(1/x)$, $x \sin(1/x)$ and the rationals indicator, show that pictures can't settle what happens "near a point". That's the job of the definition of a limit, which starts next week.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 02: Functions]]
- [[Calc I, Lecture 04: Tangents, Velocity and the Idea of a Limit]]
- [[Calc I, Lecture 13: Differentiability and Higher Derivatives]]
