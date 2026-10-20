---
id: L-0028
title: "Calc I, Lecture 25: Maxima, Minima and Critical Points"
course: Calculus I
lecture: 25
week: 9
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 11 (Significance of the Derivative), Theorems 1-2 and the closed-interval method"
summary: Maximum and local maximum points, why f' = 0 at an interior extremum (Fermat), why the converse fails, critical points, and the closed-interval method for finding absolute extrema.
---

At an **interior** maximum or minimum where $f$ is differentiable, the tangent is horizontal: **$f'(x) = 0$**. That's the one theorem about derivatives that's genuinely easy, and it's the basis of all optimization. But $f'(x) = 0$ does **not** imply an extremum ($x^3$ at $0$), so we call such points **critical points** and check candidates. On a closed interval, the **closed-interval method** finds the absolute max and min. Here's how it works:

### 1. Definitions

> [!definition] Maximum point, local maximum point (Spivak Ch. 11)
> Let $A \subseteq \operatorname{dom} f$. A point $x \in A$ is a **maximum point for $f$ on $A$** if $f(x) \ge f(y)$ for all $y \in A$; $f(x)$ is the **maximum value**.
> $x$ is a **local maximum point** for $f$ on $A$ if there is $\delta > 0$ such that $x$ is a maximum point for $f$ on $A \cap (x - \delta, x + \delta)$.
> Minimum: replace $\ge$ by $\le$ (or: $f$ has a min at $x$ iff $-f$ has a max there).

A function can have many maximum **points** but at most one maximum **value**. By the EVT (Lecture 11), a continuous $f$ on $[a, b]$ always has both.

### 2. Fermat's Theorem

> [!theorem] Spivak Theorem 11-1
> Let $f$ be defined on $(a, b)$. If $x$ is a maximum (or minimum) point for $f$ on $(a, b)$ and $f$ is differentiable at $x$, then $f'(x) = 0$.

> [!proof]
> Max case. For any $h$ with $x + h \in (a, b)$: $f(x + h) - f(x) \le 0$. So
> $$\frac{f(x + h) - f(x)}{h} \le 0 \text{ for } h > 0, \qquad \frac{f(x+h) - f(x)}{h} \ge 0 \text{ for } h < 0.$$
> Taking one-sided limits (which both equal $f'(x)$ because $f$ is differentiable there): $f'(x) \le 0$ and $f'(x) \ge 0$. So $f'(x) = 0$.

Picture: secants to the left of a peak slope up ($\ge 0$), secants to the right slope down ($\le 0$), so the tangent is squeezed to $0$.

- Only differentiability **at $x$** is assumed, not anywhere else.
- **Open interval matters**: on $[a, b]$ the max can be at an endpoint with $f' \ne 0$ (e.g. $f(x) = x$ on $[0, 1]$).
- **Local version** (Theorem 11-2): same conclusion for a local max/min in $(a, b)$, since $f'(x)$ only depends on values near $x$.

> [!definition] Critical point
> $x$ is a **critical point** of $f$ if $f'(x) = 0$; $f(x)$ is then a **critical value**.

**The converse is false**, and Spivak says it twice because people keep forgetting it: $f(x) = x^3$ has $f'(0) = 0$ but no local max or min anywhere. Critical points are only **candidates**.

### 3. The Closed-Interval Method

To find the max and min of a continuous $f$ on $[a, b]$, the extreme points must be among:

1. the **critical points** of $f$ in $(a, b)$;
2. the **endpoints** $a$ and $b$;
3. points of $(a, b)$ where $f$ is **not differentiable**.

Why: if an extreme point isn't in groups 2 or 3, it's interior and $f$ is differentiable there, so $f' = 0$ by Theorem 11-1, which puts it in group 1. So **evaluate $f$ at every candidate**: the biggest value is the max, the smallest the min.

### 4. Worked Examples

1. **$f(x) = x^3 - x$ on $[-1, 2]$** (Spivak's example). $f'(x) = 3x^2 - 1 = 0$ at $x = \pm\frac{1}{\sqrt3}$, both in the interval.
   - $f\!\left(\tfrac{1}{\sqrt3}\right) = \tfrac{1}{3\sqrt3} - \tfrac1{\sqrt3} = -\tfrac{2}{3\sqrt3}$, and $f\!\left(-\tfrac1{\sqrt3}\right) = \tfrac{2}{3\sqrt3}$.
   - $f(-1) = 0$, $f(2) = 6$.
   - **Max $6$ at $x = 2$** (an endpoint!), **min $-\tfrac{2}{3\sqrt3}$ at $x = \tfrac1{\sqrt3}$**.
2. **$f(x) = x^3 - x^2 - 8x + 1$ on $[-2, 2]$** (Problem 11-1(i)). $f'(x) = 3x^2 - 2x - 8 = (3x + 4)(x - 2)$, so the critical points are $-\frac43$ and $2$.
   - $f(-2) = 5$, $f\!\left(-\tfrac43\right) = \tfrac{203}{27} \approx 7.52$, $f(2) = -11$.
   - **Max $\tfrac{203}{27}$ at $-\tfrac43$; min $-11$ at $2$.**
3. **$f(x) = |x^2 - 1|$ on $[-2, 2]$**: not differentiable at $\pm1$ (group 3). Critical point: $f' = -2x$ on $(-1, 1)$, zero at $0$. Values: $f(\pm2) = 3$, $f(\pm1) = 0$, $f(0) = 1$. Max $3$, min $0$.
4. **Open interval: $f(x) = \dfrac{1}{1 - x^2}$ on $(-1, 1)$** (Spivak's example). $f'(x) = \dfrac{2x}{(1 - x^2)^2}$, zero only at $0$. Near $\pm1$, $f \to \infty$, so **no max**. For the min: pick $a < 0 < b$ with $f > f(0) = 1$ outside $[a, b]$; on $[a, b]$ the min is at $0$, $a$ or $b$, and the endpoints are ruled out. So **min $1$ at $0$**. On non-closed intervals you have to argue existence separately.
5. **Even-degree polynomials** have a global min on $\mathbb{R}$ (Theorem 7-10), so it occurs at a root of $f'$. Solve $f' = 0$ and compare.

### 5. Problems to Try

- **Ch. 11**: 1 (closed-interval method drill), 2 (then sketch them), 4(a) (minimize $\sum(x - a_i)^2$: the answer is the mean!), 4(b) ($\sum|x - a_i|$: the median, no calculus), 5 (local extrema of weird functions), 14.

### Conclusion

At an interior extremum where $f$ is differentiable, $f' = 0$; the proof is just the sign of the secant slopes on either side. Because the converse fails, $f' = 0$ only identifies **candidates**. On $[a, b]$ the candidates are critical points, endpoints and non-differentiable points, and comparing values finds the max and min, which the EVT guarantees exist.

## Related

- [[Calc I, Lecture 11: Extreme Values and Least Upper Bounds]]
- [[Calc I, Lecture 26: Rolle's Theorem and the Mean Value Theorem]]
- [[Calc I, Lecture 31: Optimization]]
