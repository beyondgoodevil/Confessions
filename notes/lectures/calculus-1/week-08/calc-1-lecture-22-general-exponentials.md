---
id: L-0025
title: "Calc I, Lecture 22: General Exponentials and Logarithmic Differentiation"
course: Calculus I
lecture: 22
week: 8
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 18 (The Logarithm and Exponential Functions), Theorem 4 and Problems 2, 16-19"
summary: Defining a to the x as e to the x log a, the exponent laws, logs to other bases, the power rule for real exponents, differentiating g(x) to the h(x), logarithmic differentiation, and (1 + 1/x) to the x tending to e.
---

With $e^x$ in hand, **every** power gets defined the same way: $a^x = e^{x\log a}$ for $a > 0$. All the exponent laws follow, the power rule extends to **real** exponents, and functions like $x^x$ can be differentiated by rewriting them in base $e$. **Logarithmic differentiation** (take $\log$, then differentiate) does the same job and tidies up messy products. Here's how it works:

### 1. Defining $a^x$

For rational $x$, $a^x = (e^{\log a})^x = e^{x\log a}$, and the right side makes sense for every $x$. So:

> [!definition] Spivak Ch. 18
> For $a > 0$ and any real $x$: $\quad a^x = e^{x\log a}$.

> [!theorem] Spivak Theorem 18-4
> For $a > 0$: (1) $(a^b)^c = a^{bc}$ for all $b, c$; (2) $a^1 = a$ and $a^{x+y} = a^xa^y$.

> [!proof]
> (1) $(a^b)^c = e^{c\log(a^b)} = e^{c\log(e^{b\log a})} = e^{cb\log a} = a^{bc}$.
> (2) $a^1 = e^{\log a} = a$; $a^{x+y} = e^{(x+y)\log a} = e^{x\log a}e^{y\log a}$.

Since (2) holds, this agrees with the old definition for rational $x$. And $a > 0$ is needed since $\log a$ must exist. We don't expect $(-1)^{1/2}$ to make sense anyway.

- $a > 1$: $\log a > 0$, so $a^x$ is **increasing**; $0 < a < 1$: **decreasing**; $a = 1$: constant.
- For $a \ne 1$, $a^x$ is one-one onto $(0, \infty)$, with inverse **$\log_a$**. From $x = a^y = e^{y\log a}$: $\log_a x = \dfrac{\log x}{\log a}$ (change of base).

### 2. Derivatives

1. $(a^x)' = \big(e^{x\log a}\big)' = \log a\cdot a^x$.
2. $(\log_a x)' = \dfrac{1}{x\log a}$.
3. **Real powers**: $x^a = e^{a\log x}$ for $x > 0$, so $(x^a)' = e^{a\log x}\cdot\frac ax = ax^{a-1}$. **The power rule for every real exponent.**
4. **$g(x)^{h(x)}$** (for $g > 0$): $g^h = e^{h\log g}$, so
$$\big(g^h\big)' = g^h\left(h'\log g + h\frac{g'}{g}\right).$$
Spivak's advice is not to memorize this; just rewrite in base $e$ each time, and remember the answer starts with $g(x)^{h(x)}$.

### 3. Logarithmic Differentiation

> [!definition] Logarithmic derivative (Problem 18-2)
> $(\log f)' = \dfrac{f'}{f}$ (where $f > 0$; with $\log|f|$ it works wherever $f \ne 0$, Problem 18-19).

So $f' = f\cdot(\log f)'$. This is handy for products, quotients and powers, because $\log$ turns them into sums.

**Example:** $f(x) = \dfrac{x^2(x + 1)^3}{\sqrt{x^2 + 1}}$. Then
$$\log|f| = 2\log|x| + 3\log|x + 1| - \tfrac12\log(x^2 + 1),$$
$$\frac{f'}{f} = \frac2x + \frac{3}{x + 1} - \frac{x}{x^2 + 1}, \qquad f' = f\cdot\left(\frac2x + \frac3{x+1} - \frac{x}{x^2+1}\right).$$
Much less painful than the quotient rule.

### 4. Worked Examples

1. **$x^x$** ($x > 0$): $x^x = e^{x\log x}$, so $(x^x)' = x^x(\log x + 1)$. Critical point at $\log x = -1$, i.e. $x = 1/e$: the minimum value of $x^x$ is $e^{-1/e} \approx 0.692$ (Problem 18-13).
2. $(2^x)' = 2^x\log 2$; $(10^{x^2})' = 10^{x^2}\cdot 2x\log 10$.
3. $\big((\sin x)^x\big)' = (\sin x)^x\left(\log\sin x + x\cot x\right)$ where $\sin x > 0$.
4. $(x^\pi)' = \pi x^{\pi - 1}$ but $(\pi^x)' = \pi^x\log\pi$. **Don't mix up** "variable base, constant exponent" with "constant base, variable exponent".

### 5. The Limit That Defines Compound Interest

> [!theorem] Problems 18-16, 18-17
> $$\lim_{y\to0}\frac{\log(1 + y)}{y} = 1, \qquad\text{hence}\qquad \lim_{x\to\infty}\left(1 + \frac1x\right)^x = e.$$

> [!proof]
> The first limit is $\log'(1) = 1$: it's the difference quotient of $\log$ at $1$. Then
> $$\left(1 + \frac1x\right)^x = e^{x\log(1 + 1/x)} = \exp\left(\frac{\log(1 + 1/x)}{1/x}\right) \to e^1,$$
> using $y = 1/x \to 0^+$ and continuity of $\exp$.

More generally $\left(1 + \frac ax\right)^x \to e^a$. **Interpretation** (Problem 18-18): compounding $a$ (as a fraction, e.g. $0.05$) interest $n$ times a year gives $(1 + a/n)^n$ per year, which tends to $e^a$ as $n \to \infty$: **continuous compounding**.

### 6. Problems to Try

- **Ch. 18**: 1 (differentiation drill), 2 (logarithmic derivatives), 12 ($\lim a^x$, $\lim x^{1/x}$, etc.), 13 (graph $x^x$), 14, 16, 17, 18 (interest), 19.

### Conclusion

Every power reduces to base $e$: $a^x = e^{x\log a}$ and $x^a = e^{a\log x}$. That gives the exponent laws, change of base, the power rule for real exponents, and derivatives of things like $x^x$. Logarithmic differentiation is the same idea used as a technique, and $(1 + 1/x)^x \to e$ is just the derivative of $\log$ at $1$ in disguise.

## Related

- [[Calc I, Lecture 21: The Exponential and Logarithm Functions]]
- [[Calc I, Lecture 23: Related Rates]]
- [[Calc I, Lecture 30: L'Hopital's Rule]]
