---
id: L-0027
title: "Calc I, Lecture 24: Linear Approximation and Differentials"
course: Calculus I
lecture: 24
week: 8
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 9 (Problem 20), Ch. 10 (Problems 23, 26, 27) and Ch. 11 (Problem 44)"
summary: The tangent line as the best linear approximation, differentiability as the error vanishing faster than h, differentials, worked estimates such as the square root of 66, and how good the approximation is.
---

Near $a$, a differentiable function is well approximated by its tangent line:
$$f(a + h) \approx f(a) + f'(a)\,h.$$
This is **linear approximation**. In fact differentiability is **equivalent** to saying the error is small **compared to $h$**, which makes the tangent line the **best linear approximation** to $f$ near $a$. **Differentials** are Leibniz's notation for the same idea. Here's how it works:

### 1. The Linearization

> [!definition] Linearization
> If $f$ is differentiable at $a$, its **linearization** at $a$ is the tangent-line function
> $$L(x) = f(a) + f'(a)(x - a).$$

The error $E(x) = f(x) - L(x)$ satisfies
$$\frac{E(x)}{x - a} = \frac{f(x) - f(a)}{x - a} - f'(a) \;\to\; 0 \quad\text{as } x \to a.$$
So the error isn't just small, it's **small compared to $x - a$**. That's the real content of differentiability.

> [!theorem] Best linear approximation
> Among all lines $g(x) = f(a) + m(x - a)$ through $(a, f(a))$, the tangent line ($m = f'(a)$) is the **only** one with $\dfrac{f(x) - g(x)}{x - a} \to 0$.

> [!proof]
> $\dfrac{f(x) - g(x)}{x - a} = \dfrac{f(x) - f(a)}{x - a} - m \to f'(a) - m$, which is $0$ iff $m = f'(a)$. (Spivak's Problem 9-20 asks for the polynomial version: the tangent line is the line with $f(x) - g(x)$ divisible by $(x - a)^2$.)

**A useful reformulation** (Problems 10-26, 10-27): $f$ is differentiable at $a$ iff
$$f(a + h) = f(a) + h\cdot\varphi(h)$$
for some $\varphi$ that is **continuous at $0$**, and then $\varphi(0) = f'(a)$. It's the same patched-quotient trick as the chain rule proof.

### 2. Differentials

Leibniz writes $dx$ for a change in $x$ and $dy = f'(x)\,dx$ for the corresponding change **along the tangent line**. The actual change is $\Delta y = f(x + dx) - f(x)$, and $\Delta y \approx dy$ for small $dx$. In this course $dx$ and $dy$ are just real numbers with $dy = f'(x)\,dx$, not infinitesimals.

**Use: error propagation.** If a cube's side is measured as $10$ cm with error $\pm0.1$ cm, then $V = s^3$ gives $dV = 3s^2\,ds = 300\cdot0.1 = 30$ cm³. The relative error is $\frac{dV}{V} = 3\frac{ds}{s} = 3\%$: **relative errors triple under cubing.**

### 3. Worked Examples

1. **$\sqrt{66}$.** $f(x) = \sqrt x$, $a = 64$, $f'(64) = \frac{1}{16}$:
$$\sqrt{66} \approx 8 + \tfrac1{16}\cdot2 = 8.125.$$
(True value $8.1240\ldots$.) Spivak's Problem 11-44 asks you to prove $\tfrac19 < \sqrt{66} - 8 < \tfrac18$ without computing anything. One way: $\sqrt{66} - 8 = \frac{2}{\sqrt{66} + 8}$ and $8 < \sqrt{66} < 9$. The MVT gives another (Lecture 26).
2. **$\sin(0.1)$**: $L(x) = x$ at $a = 0$, so $\sin(0.1) \approx 0.1$ (true: $0.09983$). This is the "small angle approximation" $\sin\theta \approx \theta$ from physics, i.e. $\sin'(0) = 1$ again.
3. **$(1.01)^{10}$**: $f(x) = x^{10}$ at $a = 1$: $1 + 10(0.01) = 1.1$ (true: $1.1046$). In general $(1 + h)^n \approx 1 + nh$, and Bernoulli's inequality (Problem 2-19) says the approximation is an **under**estimate for $h > -1$.
4. **$e^{0.05}$**: $1 + 0.05 = 1.05$ (true: $1.05127$).
5. **$\log(1.1)$**: $\log(1 + h) \approx h$, so $\approx 0.1$ (true: $0.0953$). An **over**estimate, because $\log$ is concave (Lecture 28).

### 4. How Big Is the Error?

The examples show a pattern: the error is about the size of $h^2$, and the sign depends on which way the graph bends. The precise version (Taylor's theorem, Spivak Ch. 20) is
$$f(a + h) - L(a + h) = \frac{f''(\xi)}{2}h^2 \quad\text{for some } \xi \text{ between } a \text{ and } a + h,$$
so $|E| \le \frac M2 h^2$ if $|f''| \le M$. Check on $\sqrt{66}$: $f''(x) = -\frac14x^{-3/2}$, and $|f''| \le \frac14\cdot64^{-3/2} = \frac{1}{2048}$ on $[64, 66]$, so $|E| \le \frac{1}{4096}\cdot4 \approx 0.00098$. The actual error is about $0.00096$, so the bound is nearly sharp.

The sign: $f'' < 0$ (concave down) means the tangent lies **above** the graph, so linear approximation **overestimates**. That's what happened for $\sqrt{66}$ and $\log 1.1$.

### 5. Problems to Try

- **Ch. 9**: 20 (tangent line of a polynomial via divisibility).
- **Ch. 10**: 23, 26, 27 (differentiability as $f(a + h) = f(a) + h\varphi(h)$).
- **Ch. 11**: 44 ($\sqrt{66}$ bounds).
- Estimate $\sqrt[3]{28}$, $\cos(0.2)$, $\arctan(1.05)$ and say whether each is an over- or underestimate.

### Conclusion

The tangent line is the unique best linear approximation, because differentiability means exactly that $f(a + h) - f(a) - f'(a)h$ is small compared to $h$. Differentials are this statement in Leibniz notation. The error is of order $h^2$, governed by $f''$, which is what the next two weeks of applications are about.

## Related

- [[Calc I, Lecture 23: Related Rates]]
- [[Calc I, Lecture 25: Maxima, Minima and Critical Points]]
- [[Calc I, Lecture 32: Newton's Method]]
- [[Calc I, Lecture 12: The Derivative]]
