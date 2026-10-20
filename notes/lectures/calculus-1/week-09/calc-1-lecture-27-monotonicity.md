---
id: L-0031
title: "Calc I, Lecture 27: Monotonicity and the First Derivative Test"
course: Calculus I
lecture: 27
week: 9
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 11 (Significance of the Derivative), Corollaries 1-3 and the sign-of-f' method"
summary: Three corollaries of the MVT (zero derivative means constant, equal derivatives differ by a constant, positive derivative means increasing), the first derivative test for local extrema, and using derivatives to prove inequalities.
---

Three consequences of the MVT turn **information about $f'$ into information about $f$**:
1. **$f' = 0$ on an interval ⇒ $f$ constant.**
2. **$f' = g'$ ⇒ $f = g + c$.**
3. **$f' > 0$ ⇒ $f$ increasing; $f' < 0$ ⇒ decreasing.**

They sound obvious (Spivak's example is that a particle whose velocity is always $0$ surely stands still) but they're surprisingly hard to prove without the MVT. From (3) we get the **first derivative test** for classifying critical points. Here's how it works:

### 1. The Three Corollaries

> [!theorem] Spivak Corollary 11-1
> If $f'(x) = 0$ for all $x$ in an interval, then $f$ is constant on the interval.

> [!proof]
> For $a < b$ in the interval, the MVT gives $x \in (a, b)$ with $0 = f'(x) = \frac{f(b) - f(a)}{b - a}$, so $f(a) = f(b)$.

**"Interval" is essential**: $f = 0$ on $(0, 1)$ and $1$ on $(2, 3)$ has $f' = 0$ but isn't constant. Same with $\arctan x + \arctan(1/x)$ on $\mathbb{R}\setminus\{0\}$ (Lecture 20).

> [!theorem] Spivak Corollary 11-2
> If $f' = g'$ on an interval, then $f = g + c$ for some constant $c$.

Proof: apply Corollary 1 to $f - g$. **This is the uniqueness half of antiderivatives** (Lecture 33): all antiderivatives of a function on an interval differ by constants.

> [!definition] Increasing, decreasing
> $f$ is **increasing** on an interval if $a < b \Rightarrow f(a) < f(b)$, and **decreasing** if $a < b \Rightarrow f(a) > f(b)$.

> [!theorem] Spivak Corollary 11-3
> If $f' > 0$ on an interval, $f$ is increasing there; if $f' < 0$, decreasing.

> [!proof]
> For $a < b$: $\frac{f(b) - f(a)}{b - a} = f'(x) > 0$ and $b - a > 0$, so $f(b) > f(a)$.

**Converse fails**: $x^3$ is increasing but $f'(0) = 0$. If $f$ is increasing and differentiable, all you can say is $f' \ge 0$.

### 2. The First Derivative Test

For a critical point $x$ of a differentiable $f$:
1. $f' > 0$ just to the left and $f' < 0$ just to the right ⇒ **local max**.
2. $f' < 0$ to the left, $f' > 0$ to the right ⇒ **local min**.
3. Same sign on both sides ⇒ **neither** (e.g. $x^3$ at $0$).

Spivak's comment is that there's no point memorizing this, because you can always draw the picture: up then down is a peak.

**Shortcut:** if $f'$ is continuous, it can only change sign at its zeros (IVT!), so between adjacent critical points $f'$ has constant sign, and **one test value per interval** settles it.

### 3. Worked Examples

1. **$f(x) = x^3 - x$.** $f'(x) = 3x^2 - 1$: positive for $|x| > \frac1{\sqrt3}$, negative for $|x| < \frac1{\sqrt3}$. So $f$ increases on $(-\infty, -\frac1{\sqrt3})$, decreases on $(-\frac1{\sqrt3}, \frac1{\sqrt3})$, increases after. **Local max at $-\frac1{\sqrt3}$, local min at $\frac1{\sqrt3}$.**
2. **$f(x) = x^4 - 2x^2$.** $f'(x) = 4x(x - 1)(x + 1)$; critical points $-1, 0, 1$ with values $-1, 0, -1$. Test points: $f'(-2) = -24 < 0$, $f'(-\frac12) > 0$, $f'(\frac12) < 0$, $f'(2) = 24 > 0$. **Local mins at $\pm1$, local max at $0$.** Even function, so the picture is symmetric.
3. **Polynomials in general**: degree $n$ ⇒ $f'$ has at most $n - 1$ roots ⇒ at most $n - 1$ critical points ⇒ at most $n$ intervals of increase/decrease.

### 4. Proving Inequalities

> [!theorem] Problem 11-27
> If $f(a) = g(a)$ and $f' > g'$ everywhere, then $f(x) > g(x)$ for $x > a$ and $f(x) < g(x)$ for $x < a$.

Proof: $f - g$ is increasing and $0$ at $a$. This is a factory for inequalities:

1. **$\sin x < x$ for $x > 0$.** For $x > 1$ it's trivial ($\sin x \le 1$). For $0 < x \le 1$, let $f(t) = t - \sin t$: $f(0) = 0$ and $f'(t) = 1 - \cos t > 0$ on $(0, 1]$, so $f(x) = f(x) - f(0) = f'(\xi)\,x > 0$ by the MVT. (Careful: $f'$ does vanish at $2\pi, 4\pi, \ldots$, so "$f' > 0$" can't be used on all of $(0, \infty)$ at once.)
2. **$e^x > 1 + x$ for $x \ne 0$.** $f(x) = e^x - 1 - x$: $f(0) = 0$ and $f'(x) = e^x - 1$ is $< 0$ for $x < 0$ and $> 0$ for $x > 0$, so $0$ is the global min.
3. **$\log(1 + x) < x$ for $x > 0$.** $f(x) = x - \log(1 + x)$: $f(0) = 0$ and $f'(x) = 1 - \frac{1}{1 + x} > 0$ for $x > 0$.
4. **Bernoulli, calculus version** (Problem 11-61): $(1 + x)^n > 1 + nx$ for $x > -1$, $x \ne 0$, $n > 1$.
5. **Find all $f$ with $f'(x) = \sin x$** (Problem 11-28): $-\cos x$ works, so by Corollary 2 **all** such $f$ are $-\cos x + c$.

### 5. Problems to Try

- **Ch. 11**: 19 (read local extrema off a graph of $f'$), 27, 28, 33 ($|f(x) - f(y)| \le |x - y|^n$ with $n > 1$ ⇒ constant), 40 ($f' = 1/x$, $f(1) = 0$ ⇒ $f(xy) = f(x) + f(y)$), 60, 61.

### Conclusion

The MVT shows that the sign of $f'$ controls whether $f$ goes up or down. A zero derivative on an interval forces a constant, and equal derivatives force equality up to a constant, which is the uniqueness fact behind antiderivatives and the FTC. The first derivative test classifies critical points by the sign change of $f'$, and the same monotonicity idea proves a whole family of inequalities.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 26: Rolle's Theorem and the Mean Value Theorem]]
- [[Calc I, Lecture 28: Concavity and the Second Derivative]]
- [[Calc I, Lecture 33: Antiderivatives]]
