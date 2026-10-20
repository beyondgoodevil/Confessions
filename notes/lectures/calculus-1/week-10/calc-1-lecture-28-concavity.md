---
id: L-0031
title: "Calc I, Lecture 28: Concavity and the Second Derivative"
course: Calculus I
lecture: 28
week: 10
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 11 (Theorems 5, 6) and Ch. 11 Appendix (Convexity and Concavity)"
summary: Convex and concave functions defined by chords, why f' increasing means convex, the second derivative test for local extrema and when it says nothing, and inflection points.
---

A function is **convex** (concave up) on an interval if every **chord lies above the graph**, and **concave** if every chord lies below. For differentiable $f$, convexity is equivalent to **$f'$ increasing**, and so **$f'' > 0$ ⇒ convex**. The second derivative also gives a quick test at critical points: **$f'(a) = 0$, $f''(a) > 0$ ⇒ local min**. A point where the tangent **crosses** the graph is an **inflection point**. Here's how it works:

### 1. Convexity Defined by Chords

> [!definition] Convex (Spivak Ch. 11 Appendix, Definition 1)
> $f$ is **convex** on an interval if for all $a < b$ in it, the segment from $(a, f(a))$ to $(b, f(b))$ lies above the graph of $f$ on $(a, b)$. **Concave**: below.

> [!definition] Equivalent analytic form (Definition 2)
> $f$ is convex iff for all $a < x < b$ in the interval,
> $$\frac{f(x) - f(a)}{x - a} < \frac{f(b) - f(a)}{b - a}.$$

In words: **secant slopes from a fixed point increase** as the other point moves right. Another standard form (Appendix Problem 4): $f(tx + (1 - t)y) < tf(x) + (1 - t)f(y)$ for $0 < t < 1$.

Spivak's convention: "convex" and "concave" here, while many textbooks say "concave up" and "concave down". Same thing.

### 2. Convexity and Derivatives

> [!theorem] Appendix Theorem 1
> If $f$ is convex and differentiable at $a$, the graph lies **above the tangent line** at $a$ (except at the point of tangency). If $a < b$ and $f$ is differentiable at both, then $f'(a) < f'(b)$.

> [!theorem] Appendix Theorem 2
> If $f$ is differentiable and $f'$ is increasing, then $f$ is convex.

> [!proof] Sketch
> Subtract the chord: $g(x) = f(x) - \frac{f(b) - f(a)}{b - a}(x - a)$. Then $g' = f' - \text{const}$ is still increasing and $g(a) = g(b)$, so it suffices to prove the **Lemma**: if $g'$ is increasing and $g(a) = g(b)$, then $g(x) < g(a)$ for $a < x < b$.
> Suppose instead $g(x) > g(a)$ somewhere in $(a, b)$. Then the max of $g$ on $[a, b]$ is at an interior $x_0$, so $g'(x_0) = 0$. The MVT on $[a, x_0]$ gives $x_1 < x_0$ with $g'(x_1) = \frac{g(x_0) - g(a)}{x_0 - a} > 0 = g'(x_0)$, contradicting "$g'$ increasing". (The case $g(x) = g(a)$ for some interior $x$ is ruled out by a similar argument applied to $[a, x]$ and $[x, b]$.) So the graph of $f$ is below the chord.

**Putting it together:**
$$f'' > 0 \;\Rightarrow\; f' \text{ increasing} \;\Rightarrow\; f \text{ convex} \;\Rightarrow\; \text{graph above tangents, below chords}.$$
And $f'' < 0$ ⇒ concave. (Theorem 3 of the appendix: lying above every tangent also implies convex.)

### 3. Inflection Points

> [!definition] Inflection point (Spivak Ch. 11 Appendix)
> $a$ is an **inflection point** of $f$ if the tangent line at $(a, f(a))$ **crosses** the graph there.

- If $f''$ exists, it must **change sign** at an inflection point (convex on one side, concave on the other).
- **$f''(a) = 0$ is not enough**: $f(x) = x^4$ has $f''(0) = 0$ but is convex everywhere, so the tangent at $0$ doesn't cross.

**Example ($f(x) = \frac{1}{1 + x^2}$, Spivak's):** $f'(x) = \dfrac{-2x}{(1 + x^2)^2}$, $f''(x) = \dfrac{6x^2 - 2}{(1 + x^2)^3}$. So $f'' > 0$ for $|x| > \frac1{\sqrt3}$ (convex) and $f'' < 0$ for $|x| < \frac1{\sqrt3}$ (concave). **Inflection points at $x = \pm\frac{1}{\sqrt3}$.** This is the bell shape.

### 4. The Second Derivative Test

> [!theorem] Spivak Theorem 11-5
> Suppose $f'(a) = 0$. If $f''(a) > 0$, then $f$ has a local **minimum** at $a$; if $f''(a) < 0$, a local **maximum**.

> [!proof]
> $f''(a) = \lim_{h\to0}\frac{f'(a + h) - f'(a)}{h} = \lim_{h\to0}\frac{f'(a+h)}{h}$. If this is $> 0$, then for small $h$, $f'(a + h)$ has the **same sign as $h$**: negative just left of $a$, positive just right. By Corollary 11-3, $f$ decreases then increases, so $a$ is a local min.

**When it's silent:** if $f''(a) = 0$, anything can happen. $-x^4$, $x^4$ and $x^5$ all have $f'(0) = f''(0) = 0$, and $0$ is a max, a min, and neither, respectively. Fall back on the first derivative test.

> [!theorem] Spivak Theorem 11-6 (partial converse)
> If $f''(a)$ exists and $a$ is a local min, then $f''(a) \ge 0$; if a local max, $f''(a) \le 0$.

(Can't be improved to strict: $x^4$.)

**Example:** $f(x) = x^3 - x$, $f''(x) = 6x$. At $-\frac{1}{\sqrt3}$, $f'' < 0$, so local max; at $\frac1{\sqrt3}$, $f'' > 0$, so local min. That matches Lecture 27, with less work.

### 5. Worked Examples

1. **$e^x$ is convex** ($f'' = e^x > 0$), so it lies above its tangent at $0$: $e^x \ge 1 + x$, with equality only at $0$. Same conclusion as last lecture, now with a picture.
2. **$\log$ is concave** ($f'' = -1/x^2$), so it lies below its tangent at $1$: $\log x \le x - 1$. Also below-the-chord gives $\log(tx + (1-t)y) \ge t\log x + (1 - t)\log y$, which exponentiates to the **weighted AM–GM inequality**.
3. **$\sqrt x$ is concave**, which is why linear approximation **overestimated** $\sqrt{66}$ in Lecture 24.
4. **$f(x) = x^4 - 4x^3$**: $f'' = 12x^2 - 24x = 12x(x - 2)$. Convex on $(-\infty, 0)$ and $(2, \infty)$, concave on $(0, 2)$, inflections at $0$ and $2$. Critical points: $f' = 4x^2(x - 3)$, so $x = 0$ (no sign change: not an extremum, but an inflection with horizontal tangent) and $x = 3$ ($f''(3) = 36 > 0$: local min, $f(3) = -27$).

### 6. Problems to Try

- **Ch. 11 Appendix**: 1 (convexity and inflections for the functions of Problem 11-1), 2 (sketch $f$ from a graph of $f'$), 4, 5 (convex increasing ∘ convex is convex), 7, 8.
- **Ch. 11**: 62 ($x^4\sin^2(1/x)$: a local min that the first derivative test can't detect).

### Conclusion

Convex means chords above the graph, which for differentiable functions is the same as $f'$ increasing, so it follows from $f'' > 0$. The second derivative test classifies a critical point by the sign of $f''$ but says nothing when $f'' = 0$. Inflection points need a genuine sign change of $f''$, not just a zero. Together with the first derivative this is everything needed to sketch graphs properly.

## Related

- [[Calc I, Lecture 27: Monotonicity and the First Derivative Test]]
- [[Calc I, Lecture 29: Curve Sketching]]
- [[Calc I, Lecture 24: Linear Approximation and Differentials]]
