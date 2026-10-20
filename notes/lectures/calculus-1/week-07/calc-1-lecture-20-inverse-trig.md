---
id: L-0023
title: "Calc I, Lecture 20: Inverse Trigonometric Functions"
course: Calculus I
lecture: 20
week: 7
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 15 (The Trigonometric Functions), Theorem 3 and Problems 16, 23, 24"
summary: Restricting sin, cos and tan so they become one-one, the functions arcsin, arccos and arctan, their derivatives (which have no trig in them), and simplifying expressions like cos(arcsin x).
---

$\sin$, $\cos$ and $\tan$ aren't one-one, but they are on suitable intervals: $\sin$ on $[-\pi/2, \pi/2]$, $\cos$ on $[0, \pi]$, $\tan$ on $(-\pi/2, \pi/2)$. Their inverses are **$\arcsin$, $\arccos$, $\arctan$**. The inverse function rule gives derivatives with **no trig functions in them at all**:
$$\arcsin'(x) = \frac{1}{\sqrt{1 - x^2}},\quad \arccos'(x) = \frac{-1}{\sqrt{1-x^2}},\quad \arctan'(x) = \frac{1}{1 + x^2}.$$
Here's how it works:

### 1. Choosing the Intervals

Any interval on which $\sin$ is one-one has length at most $\pi$ (Problem 15-23), so we pick a standard one:

| Function | Restricted to | Inverse | Domain of inverse | Range of inverse |
|---|---|---|---|---|
| $\sin$ | $[-\pi/2, \pi/2]$ | $\arcsin$ | $[-1, 1]$ | $[-\pi/2, \pi/2]$ |
| $\cos$ | $[0, \pi]$ | $\arccos$ | $[-1, 1]$ | $[0, \pi]$ |
| $\tan$ | $(-\pi/2, \pi/2)$ | $\arctan$ | $\mathbb{R}$ | $(-\pi/2, \pi/2)$ |

- Spivak avoids writing $\sin^{-1}$ because $\arcsin$ is **not** the inverse of $\sin$ (which isn't one-one) but of the restricted function (sometimes written $\operatorname{Sin}$).
- **Watch out:** $\arcsin(\sin x) = x$ only for $x \in [-\pi/2, \pi/2]$. E.g. $\arcsin(\sin \pi) = \arcsin 0 = 0 \ne \pi$. But $\sin(\arcsin x) = x$ for every $x \in [-1, 1]$.
- $\arctan$ is a nice example: **differentiable, one-one on all of $\mathbb{R}$, and bounded**, with horizontal asymptotes $y = \pm\pi/2$.

### 2. Simplifying Compositions

To write $\arcsin'$ nicely we need $\cos(\arcsin x)$ without trig. Use $\sin^2 + \cos^2 = 1$:
$$x^2 + \cos^2(\arcsin x) = 1 \;\Rightarrow\; \cos(\arcsin x) = \sqrt{1 - x^2},$$
taking the **positive** root because $\arcsin x \in [-\pi/2, \pi/2]$, where $\cos \ge 0$. A right triangle with opposite side $x$ and hypotenuse $1$ gives the same thing, which is a good way to remember it (but don't use it as the proof).

Similarly, dividing $\sin^2 + \cos^2 = 1$ by $\cos^2$ gives $\tan^2 + 1 = \sec^2$, so $\sec^2(\arctan x) = 1 + x^2$. And (Problem 15-16)
$$\sin(\arctan x) = \frac{x}{\sqrt{1 + x^2}}, \qquad \cos(\arctan x) = \frac{1}{\sqrt{1 + x^2}}.$$

### 3. The Derivatives

> [!theorem] Spivak Theorem 15-3
> For $-1 < x < 1$: $\arcsin'(x) = \dfrac{1}{\sqrt{1-x^2}}$ and $\arccos'(x) = \dfrac{-1}{\sqrt{1 - x^2}}$. For all $x$: $\arctan'(x) = \dfrac{1}{1 + x^2}$.

> [!proof]
> By Theorem 12-5:
> $$\arcsin'(x) = \frac{1}{\sin'(\arcsin x)} = \frac{1}{\cos(\arcsin x)} = \frac{1}{\sqrt{1 - x^2}},$$
> $$\arctan'(x) = \frac{1}{\tan'(\arctan x)} = \frac{1}{\sec^2(\arctan x)} = \frac{1}{1 + x^2}.$$
> $\arccos$ is the same as $\arcsin$ with a sign change (Spivak actually got it already in the proof of Theorem 15-1, since his $\cos$ is defined as an inverse).

- At $x = \pm1$, $\arcsin$ isn't differentiable: $\sin'(\pm\pi/2) = 0$, so Theorem 12-4 applies (vertical tangents).
- Since $\arcsin' + \arccos' = 0$, the sum is constant: $\arcsin x + \arccos x = \pi/2$ (check at $x = 0$). Strictly, "derivative zero ⇒ constant" is the MVT, Lecture 27.

**Spivak's remark:** because $\arcsin'(x) = 1/\sqrt{1 - t^2}$, the FTC gives $\arcsin x = \int_0^x \frac{dt}{\sqrt{1-t^2}}$. One *could* define $\arcsin$ this way and then $\sin$ as its inverse. Spivak rejects that for trig because it's unmotivated, but it's exactly the strategy that works for $\log$ (Lecture 21).

### 4. Worked Examples

1. $\big(\arctan(x^2)\big)' = \dfrac{2x}{1 + x^4}$.
2. $\big(\arcsin(2x)\big)' = \dfrac{2}{\sqrt{1 - 4x^2}}$ for $|x| < \tfrac12$.
3. $\big(x\arctan x\big)' = \arctan x + \dfrac{x}{1 + x^2}$.
4. **$\arctan x + \arctan(1/x)$ for $x > 0$**: derivative $\dfrac{1}{1 + x^2} + \dfrac{1}{1 + 1/x^2}\cdot\left(-\dfrac{1}{x^2}\right) = \dfrac{1}{1 + x^2} - \dfrac{1}{x^2 + 1} = 0$. So it's constant on $(0, \infty)$, equal to $2\arctan 1 = \pi/2$. (On $(-\infty, 0)$ it's $-\pi/2$: a function with zero derivative needn't be constant on a **non-interval**.)
5. **Antiderivative preview**: since $\arctan' = \frac{1}{1 + x^2}$, we'll get $\int_0^1\frac{dx}{1 + x^2} = \arctan 1 = \frac\pi4$ (Lecture 37).

### 5. Problems to Try

- **Ch. 15**: 1 (differentiate, e.g. $\arctan(\arctan(\arctan x))$), 10 (an addition formula for $\arcsin$), 16, 17 (the substitution $x = \tan(u/2)$), 23, 24 ($\sec^{-1}$).

### Conclusion

Restrict, invert, and apply $1/f'(f^{-1})$. Simplifying $\cos(\arcsin x)$ and $\sec^2(\arctan x)$ with the Pythagorean identity removes the trig, which leaves algebraic derivatives: $\frac{1}{\sqrt{1-x^2}}$ and $\frac{1}{1+x^2}$. Those are why inverse trig functions keep turning up as antiderivatives of perfectly algebraic functions.

## Related

- [[Calc I, Lecture 19: Inverse Functions and Their Derivatives]]
- [[Calc I, Lecture 21: The Exponential and Logarithm Functions]]
- [[Calc I, Lecture 17: Derivatives of the Trigonometric Functions]]
