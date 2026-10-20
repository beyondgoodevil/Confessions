---
id: L-0025
title: "Calc I, Lecture 21: The Exponential and Logarithm Functions"
course: Calculus I
lecture: 21
week: 7
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 18 (The Logarithm and Exponential Functions), Theorems 1-3, 5, 6"
summary: Why 10 to an irrational power is hard to define, Spivak's definition of log as the integral of 1/t, exp as its inverse, the derivatives log' = 1/x and exp' = exp, the number e, and why exp beats every polynomial.
---

Defining $10^x$ for **irrational** $x$ is surprisingly hard. Algebra only gets you to rational exponents. Spivak's solution goes backwards: **define** $\log x = \int_1^x \frac{dt}{t}$, prove it turns products into sums, and **define** $\exp = \log^{-1}$. Then $\log'(x) = \frac1x$ and $\exp' = \exp$ come out almost for free. We're using the integral here a few weeks before we build it (Lectures 35–37), so this lecture is on credit, and Lecture 39 pays it back. Here's how it works:

### 1. The Problem With $10^x$

The rule $10^{x+y} = 10^x\cdot10^y$ **forces** the usual definitions: $10^0 = 1$, $10^{-n} = 1/10^n$, $10^{1/n} = \sqrt[n]{10}$, $10^{m/n} = (\sqrt[n]{10})^m$. Then it stops. No algebraic trick defines $10^{\sqrt2}$. Even worse, Spivak notes there are infinitely many (wildly discontinuous) functions with $f(x + y) = f(x)f(y)$ and $f(1) = 10$, so the functional equation alone doesn't pin down $10^x$. **We need calculus to define it.**

### 2. Logarithm as an Integral

Think about what a logarithm should satisfy: $\log(xy) = \log x + \log y$ and, if it's differentiable, $\log'(x) = \frac{c}{x}$ for some constant. (Differentiate $\log(xy)$ in $x$: $y\log'(xy) = \log'(x)$, so $x\log'(x)$ is constant.) Choosing $c = 1$ and $\log 1 = 0$ suggests:

> [!definition] Logarithm (Spivak Ch. 18)
> For $x > 0$:
> $$\log x = \int_1^x \frac1t\,dt.$$

- $\log x > 0$ for $x > 1$, $\log x < 0$ for $0 < x < 1$, $\log 1 = 0$.
- By the FTC (Lecture 37), **$\log'(x) = \dfrac1x$**, so $\log$ is increasing.

> [!theorem] Spivak Theorem 18-1
> For $x, y > 0$: $\log(xy) = \log x + \log y$.

> [!proof]
> Fix $y > 0$ and let $f(x) = \log(xy)$. Chain rule: $f'(x) = \frac{1}{xy}\cdot y = \frac1x = \log'(x)$. Two functions with the same derivative on an interval differ by a constant (MVT, Lecture 27): $\log(xy) = \log x + c$. Put $x = 1$: $\log y = 0 + c$.

Consequences: $\log(x^n) = n\log x$ (induction), $\log(x/y) = \log x - \log y$. Since $\log 2^n = n\log2 \to \infty$, **$\log$ is unbounded above**, and since $\log(1/x) = -\log x$, it's unbounded below. Being continuous, it takes **every real value** (IVT).

### 3. Exponential as the Inverse

> [!definition]
> $\exp = \log^{-1}$, defined on all of $\mathbb{R}$, with values in $(0, \infty)$.

> [!theorem] Spivak Theorems 18-2, 18-3
> $\exp'(x) = \exp(x)$ for all $x$, and $\exp(x + y) = \exp(x)\exp(y)$.

> [!proof]
> Inverse rule: $\exp'(x) = \dfrac{1}{\log'(\exp x)} = \dfrac{1}{1/\exp(x)} = \exp(x)$.
> For the second, let $x' = \exp x$ and $y' = \exp y$. Then $\log(x'y') = x + y$, so $\exp(x + y) = x'y'$.

> [!definition] The number e
> $e = \exp(1)$, i.e. the number with $\int_1^e\frac{dt}{t} = 1$.

**Bounding $e$** with upper/lower sums for $1/t$: $\int_1^2\frac{dt}{t} < 1$ (upper sum $1\cdot 1$) and $\int_1^4\frac{dt}{t} > 1$ (lower sum $\frac12\cdot1 + \frac14\cdot2 = 1$), so **$2 < e < 4$**. (Actually $e \approx 2.71828$; Spivak's Ch. 20 does much better and proves $e$ is irrational.)

Since $\exp(x + y) = \exp x\exp y$ and $\exp 1 = e$, $\exp(x) = e^x$ for all **rational** $x$, so we **define** $e^x = \exp(x)$ for all $x$. Irrational powers of $e$ now make sense.

### 4. Characterizations

> [!theorem] Spivak Theorem 18-5
> If $f' = f$ everywhere, then $f(x) = ce^x$ for some constant $c$.

> [!proof]
> $\left(\dfrac{f(x)}{e^x}\right)' = \dfrac{e^xf'(x) - f(x)e^x}{e^{2x}} = 0$, so $f/e^x$ is constant.

Generalization (Problem 18-20): $f' = kf$ ⇒ $f(x) = Ce^{kx}$. This is the law for **exponential growth/decay**: populations, radioactive decay (Problem 18-21), Newton's law of cooling (Problem 18-22).

### 5. Exp Beats Every Polynomial

> [!theorem] Spivak Theorem 18-6
> For every natural number $n$, $\displaystyle\lim_{x\to\infty}\frac{e^x}{x^n} = \infty$.

> [!proof] Sketch in three steps
> (1) $\log x < x - 1 < x$ for $x > 1$ ($x - 1$ is an upper sum for $1/t$ on $[1, x]$), so $e^x > x$.
> (2) $\dfrac{e^x}{x} = \dfrac12\cdot\dfrac{e^{x/2}}{x/2}\cdot e^{x/2}$, which is greater than $\frac12 e^{x/2} \to \infty$ by step 1.
> (3) $\dfrac{e^x}{x^n} = \dfrac{1}{n^n}\left(\dfrac{e^{x/n}}{x/n}\right)^n \to \infty$ by step 2.

Equivalently, **$\log$ grows slower than any positive power**: $\frac{\log x}{x^a} \to 0$ for $a > 0$.

### 6. Worked Examples

1. $\big(e^{x^2}\big)' = 2xe^{x^2}$; $\big(e^{\sin x}\big)' = \cos x\,e^{\sin x}$.
2. $\big(\log(x^2 + 1)\big)' = \dfrac{2x}{x^2 + 1}$.
3. **$\log|x|$** (Problem 18-19): for $x < 0$, $\log|x| = \log(-x)$ has derivative $\frac{-1}{-x} = \frac1x$. So $(\log|x|)' = \frac1x$ for **all** $x \ne 0$.
4. $\big(x\log x - x\big)' = \log x + 1 - 1 = \log x$, an antiderivative of $\log$ (Spivak opens Ch. 19 with exactly this).
5. **Half-life**: if $m' = -km$, then $m(t) = m_0e^{-kt}$, and $m = m_0/2$ when $t = \frac{\log 2}{k}$.

### 7. Problems to Try

- **Ch. 18**: 1 (differentiate), 4 (graphs), 6 and 7 ($\sinh$, $\cosh$: define them and check $\cosh^2 - \sinh^2 = 1$), 19 ($\log|x|$), 20, 21, 22 (growth, decay, cooling).

### Conclusion

$\log$ is defined as the area under $1/t$, $\exp$ as its inverse, and $e^x$ as $\exp(x)$. That gives a rigorous meaning to irrational powers, and the derivatives $\log' = 1/x$ and $\exp' = \exp$ come straight from the FTC and the inverse rule. The only functions equal to their own derivative are $ce^x$, and exponentials outgrow every polynomial.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 20: Inverse Trigonometric Functions]]
- [[Calc I, Lecture 22: General Exponentials and Logarithmic Differentiation]]
- [[Calc I, Lecture 39: The Logarithm as an Integral]]
