---
id: L-0011
title: "Calc I, Lecture 07: One-Sided Limits and Limits at Infinity"
course: Calculus I
lecture: 7
week: 3
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 5 (Limits), end of chapter and Problems 29-39"
summary: Limits from above and below, limits as x goes to infinity, infinite limits, and how to read off asymptotes of rational functions.
---

The basic definition only handles "$x \to a$ from both sides, to a finite number". Three variations get used all the time: **one-sided limits** $x \to a^+$, $x \to a^-$; **limits at infinity** $x \to \infty$; and **infinite limits** $f(x) \to \infty$. Each is the ε–δ definition with **one condition swapped** for a different notion of "close" or "large". Here's how it works:

### 1. One-Sided Limits

> [!definition] Limit from above / below
> $\lim_{x \to a^+} f(x) = l$ means: for every $\varepsilon > 0$ there is $\delta > 0$ such that if $0 < x - a < \delta$, then $|f(x) - l| < \varepsilon$.
> $\lim_{x \to a^-} f(x) = l$: same with $0 < a - x < \delta$.

The only change is that $0 < |x - a| < \delta$ becomes "$x$ is within $\delta$ of $a$ **and on one side**".

- **Why we need them:** functions defined only on one side, e.g. $\sqrt x$ at $0$: $\lim_{x\to0^+}\sqrt x = 0$ (take $\delta = \varepsilon^2$), though the two-sided limit doesn't make sense.
- **Sign function** at $0$: $\lim_{x\to0^+} = 1$, $\lim_{x\to0^-} = -1$, two-sided limit doesn't exist.
- **Floor function** $[x]$ at an integer $n$: from above $\to n$, from below $\to n - 1$.

> [!theorem] Problem 5-29
> $\lim_{x\to a} f(x)$ exists iff both one-sided limits exist and are equal (and then all three agree).

> [!proof] Sketch
> (⇒) A δ that works two-sided works on each side. (⇐) Given ε, take $\delta_+$ and $\delta_-$ for the two sides and let $\delta = \min(\delta_+, \delta_-)$.

### 2. Limits at Infinity

> [!definition] Limit at infinity
> $\lim_{x\to\infty} f(x) = l$ means: for every $\varepsilon > 0$ there is a number $N$ such that if $x > N$, then $|f(x) - l| < \varepsilon$.

"$0 < |x - a| < \delta$" (x close to $a$) has been replaced by "$x > N$" (x large). Similarly for $x \to -\infty$ with $x < N$ (Problem 5-36).

**Basic example:** $\lim_{x\to\infty} \frac1x = 0$. Given ε, take $N = 1/\varepsilon$: if $x > N > 0$ then $0 < 1/x < \varepsilon$. More generally $\lim_{x\to\infty} 1/x^k = 0$.

The limit laws (sum, product, quotient) hold for $x \to \infty$ with identical proofs: replace "take $\delta = \min$" by "take $N = \max$".

> [!theorem] Rational functions at infinity (Problem 5-32)
> $\displaystyle\lim_{x\to\infty} \frac{a_n x^n + \cdots + a_0}{b_m x^m + \cdots + b_0}$ (with $a_n, b_m \ne 0$) exists iff $m \ge n$. It equals $a_n / b_n$ if $m = n$ and $0$ if $m > n$.

**Trick:** divide top and bottom by $x^m$ (the bottom's top power), so every term is a constant or a multiple of some $1/x^k$, and then only $\lim 1/x^k = 0$ is needed.

### 3. Infinite Limits

> [!definition] Problem 5-37
> $\lim_{x\to a} f(x) = \infty$ means: for every $N$ there is $\delta > 0$ such that if $0 < |x - a| < \delta$, then $f(x) > N$.

Now "$|f(x) - l| < \varepsilon$" (f(x) close to $l$) has become "$f(x) > N$" (f(x) large). One-sided versions and $-\infty$ are analogous (Problem 5-38).

- $\lim_{x\to0} \frac1{x^2} = \infty$: given $N > 0$, take $\delta = 1/\sqrt N$.
- $\frac1x$: $\to \infty$ as $x \to 0^+$, $\to -\infty$ as $x \to 0^-$, so there's no two-sided anything.

> [!note] "= ∞" is just shorthand
> $\lim f(x) = \infty$ does **not** mean the limit exists: $\infty$ isn't a number, and the limit laws don't apply to it ($\infty - \infty$ means nothing). It's shorthand for one specific way of *not* having a limit.

**Asymptotes** (vocabulary, not in Spivak's text but standard): $x = a$ is a **vertical asymptote** if $f \to \pm\infty$ as $x \to a^\pm$; $y = l$ is a **horizontal asymptote** if $f \to l$ as $x \to \pm\infty$.

### 4. Worked Examples

1. $\displaystyle\lim_{x\to\infty}\frac{3x^2 + 1}{5x^2 - x} = \lim \frac{3 + 1/x^2}{5 - 1/x} = \frac35$.
2. $\displaystyle\lim_{x\to\infty}\frac{x^3 + 4x - 7}{7x^2 - x + 1}$ (Problem 5-39(i)): numerator degree is bigger, so there is no finite limit. Dividing by $x^2$ shows the quotient behaves like $x/7 \to \infty$.
3. $\displaystyle\lim_{x\to\infty}\left(\sqrt{x^2 + x} - x\right)$: multiply by the conjugate:
$$\frac{(x^2 + x) - x^2}{\sqrt{x^2+x} + x} = \frac{x}{\sqrt{x^2 + x} + x} = \frac{1}{\sqrt{1 + 1/x} + 1} \to \frac12.$$
4. $\displaystyle\lim_{x\to2^+}\frac{x+1}{x-2} = \infty$, $\displaystyle\lim_{x\to2^-}\frac{x+1}{x-2} = -\infty$: numerator $\to 3 > 0$, denominator $\to 0$ through positive/negative values.
5. **Swapping infinity for zero** (Problem 5-34): $\lim_{x\to\infty} f(x) = \lim_{x\to0^+} f(1/x)$. E.g. $\lim_{x\to\infty} x\sin(1/x) = \lim_{t\to0^+} \frac{\sin t}{t}$, which is Lecture 8's limit.

### 5. Problems to Try

- **Ch. 5**: 27 (one-sided limits for the functions of 4-17), 29, 30, 32, 33 (limits at ∞), 34, 36, 37, 38 (infinite limits), 39 (mixed practice).

### Conclusion

One-sided limits, limits at infinity and infinite limits are all the same ε–δ template with "near $a$" or "near $l$" swapped for "on one side of $a$", "large $x$" or "large $f(x)$". For rational functions everything comes down to $\lim 1/x^k = 0$ and comparing degrees.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 06: The Limit Laws]]
- [[Calc I, Lecture 08: The Squeeze Theorem and sin x over x]]
- [[Calc I, Lecture 29: Curve Sketching]]
