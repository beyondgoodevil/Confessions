---
id: L-0021
title: "Calc I, Lecture 18: Implicit Differentiation"
course: Calculus I
lecture: 18
week: 6
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 12 (Inverse Functions), Problems 11-16"
summary: Functions defined implicitly by equations, differentiating both sides with the chain rule, tangent lines to curves that aren't graphs, second derivatives, and what implicit differentiation does and doesn't prove.
---

An equation like $x^2 + y^2 = 1$ doesn't define $y$ as **one** function of $x$, but it can define **functions implicitly**: functions $f$ with $x^2 + f(x)^2 = 1$. If we assume such an $f$ is differentiable, we can find $f'$ by **differentiating both sides of the equation** with the chain rule and solving for $f'$. That's **implicit differentiation**. Spivak introduces it in the problems to Ch. 12. Here's how it works:

### 1. Functions Defined Implicitly

**Circle** (Problem 12-12): the differentiable functions on $(-1, 1)$ satisfying $x^2 + [f(x)]^2 = 1$ are exactly
$$f(x) = \sqrt{1 - x^2} \quad\text{and}\quad f(x) = -\sqrt{1 - x^2}.$$
There are none outside $[-1, 1]$. And $x^2 + [f(x)]^2 = -1$ defines nothing at all.

**A nicer case** (Problem 12-11): $y^5 + y + x = 0$. For each $x$ there's exactly one $y$, because $g(y) = -(y^5 + y)$ is strictly decreasing and takes all values. So the equation defines a single function $f$ on all of $\mathbb{R}$; in fact $f = g^{-1}$, an inverse function (Lecture 19).

In general, deciding **where** an equation defines a differentiable function is a job for the **implicit function theorem** (advanced calculus). In Calc I we **assume** a differentiable solution exists and compute its derivative.

### 2. The Method

1. Replace $y$ by $f(x)$ (mentally) and **differentiate both sides** with respect to $x$. Every $y$-term gets a factor $y'$ by the chain rule: $(y^n)' = ny^{n-1}y'$, $(\sin y)' = \cos y\cdot y'$, $(xy)' = y + xy'$.
2. **Solve for $y'$.** The answer will usually involve both $x$ and $y$, which makes sense because there can be more than one function defined by the same equation.

**Circle:** $x^2 + y^2 = 1 \Rightarrow 2x + 2yy' = 0 \Rightarrow y' = -\dfrac{x}{y}$ (where $y \ne 0$).

**Check (Problem 12-13(b))** against both explicit solutions: for $y = \sqrt{1 - x^2}$, $y' = \dfrac{-x}{\sqrt{1-x^2}} = -\dfrac xy$ ✓; for $y = -\sqrt{1-x^2}$, $y' = \dfrac{x}{\sqrt{1-x^2}} = -\dfrac{x}{y}$ ✓. One formula covers both branches. Geometrically the tangent is perpendicular to the radius (slope $y/x$).

### 3. Worked Examples

1. **$y^5 + y + x = 0$**: $5y^4y' + y' + 1 = 0$, so $y' = \dfrac{-1}{5y^4 + 1}$. The denominator is never $0$, which is consistent with $f$ being differentiable everywhere.
2. **$x^3 + y^3 = 7$** (Problem 12-14): $3x^2 + 3y^2y' = 0 \Rightarrow y' = -\dfrac{x^2}{y^2}$. For the solution through $(-1, 2)$: $y'(-1) = -\tfrac14$. Second derivative, by the quotient rule on $-x^2/y^2$ (remembering $y$ is a function of $x$):
$$y'' = -\frac{2xy^2 - 2x^2yy'}{y^4}.$$
At $(-1, 2)$ with $y' = -\tfrac14$: numerator $= 2(-1)(4) - 2(1)(2)(-\tfrac14) = -8 + 1 = -7$, so $y'' = \tfrac{7}{16}$.
3. **Tangent line to $3x^3 + 4x^2y - xy^2 + 2y^3 = 4$ at $(-1, 1)$** (Problem 12-15). First check the point: $-3 + 4 + 1 + 2 = 4$ ✓. Differentiate:
$$9x^2 + 8xy + 4x^2y' - y^2 - 2xyy' + 6y^2y' = 0.$$
At $(-1, 1)$: $9 - 8 + 4y' - 1 + 2y' + 6y' = 0$, so $12y' = 0$ and $y' = 0$. Tangent line: **$y = 1$**.
4. **$y^4 + y^3 + xy = 1$** (Problem 12-16, Spivak's Leibniz-notation example): $4y^3y' + 3y^2y' + y + xy' = 0$, so
$$y' = \frac{-y}{4y^3 + 3y^2 + x}.$$
5. **$x^{1/n}$ preview**: if $y = x^{1/n}$ then $y^n = x$, so $ny^{n-1}y' = 1$ and $y' = \dfrac{1}{n y^{n-1}} = \dfrac1n x^{\frac1n - 1}$. (This **assumes** $y$ is differentiable; Lecture 19 proves it.)
6. **$\sin(xy) = x$**: $\cos(xy)(y + xy') = 1$, so $y' = \dfrac{1 - y\cos(xy)}{x\cos(xy)}$.

### 4. What Implicit Differentiation Proves

It proves: **if** $f$ is differentiable and satisfies the equation, **then** $f'$ is given by the formula. It does **not** prove that such an $f$ exists or is differentiable. For inverse functions we'll get existence and differentiability from Theorem 12-5, and Spivak's Problem 12-11 shows the slick way: express $f$ as an inverse, then use the inverse function theorem.

### 5. Problems to Try

- **Ch. 10**: 13 (the circle's tangent meets it only once), 14 (same for ellipse and hyperbola).
- **Ch. 12**: 11 (all parts: existence via inverse function, then derivative two ways), 12, 13, 14, 15, 16.

### Conclusion

Implicit differentiation is just the chain rule applied to an equation in which $y$ stands for an unknown differentiable function of $x$. It finds slopes of tangent lines to curves that aren't graphs, and $y''$ as well. But it assumes differentiability rather than proving it, and that gap is filled next week by the theory of inverse functions.

## Related

- [[Calc I, Lecture 17: Derivatives of the Trigonometric Functions]]
- [[Calc I, Lecture 19: Inverse Functions and Their Derivatives]]
- [[Calc I, Lecture 23: Related Rates]]
