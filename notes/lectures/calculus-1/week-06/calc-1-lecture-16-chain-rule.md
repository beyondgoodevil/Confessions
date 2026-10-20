---
id: L-0019
title: "Calc I, Lecture 16: The Chain Rule"
course: Calculus I
lecture: 16
week: 6
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 10 (Differentiation), Theorem 9"
summary: The chain rule, why the obvious proof breaks, Spivak's auxiliary-function proof, how to differentiate long compositions mechanically, and what it says about x squared sin(1/x).
---

The **chain rule** says $(f\circ g)'(a) = f'(g(a))\cdot g'(a)$: differentiate the outer function **at the inner value**, then multiply by the derivative of the inner function. It's the single most-used rule in the course, and the obvious "multiply and divide by $g(a+h) - g(a)$" proof **doesn't quite work**. Spivak's fix uses an auxiliary function $\varphi$. Here's how it works:

### 1. The Statement

> [!theorem] Spivak Theorem 10-9 (Chain rule)
> If $g$ is differentiable at $a$ and $f$ is differentiable at $g(a)$, then $f\circ g$ is differentiable at $a$ and
> $$(f\circ g)'(a) = f'(g(a))\cdot g'(a).$$

In Leibniz notation, with $u = g(x)$ and $y = f(u)$: $\dfrac{dy}{dx} = \dfrac{dy}{du}\cdot\dfrac{du}{dx}$. It looks like fraction cancellation, which is why people like it, but remember that $dy/du$ has to be evaluated at $u = g(x)$.

### 2. The Tempting Proof and Its Bug

$$\frac{f(g(a+h)) - f(g(a))}{h} = \frac{f(g(a+h)) - f(g(a))}{g(a+h) - g(a)}\cdot\frac{g(a+h) - g(a)}{h}.$$
Second factor $\to g'(a)$; in the first, set $k = g(a+h) - g(a) \to 0$ (continuity of $g$) and it "looks like" $\frac{f(g(a) + k) - f(g(a))}{k} \to f'(g(a))$.

**The bug:** $g(a+h) - g(a)$ can be **zero for arbitrarily small $h \ne 0$**, and then we've divided by zero. Constant $g$ is the trivial case. A non-trivial one is $g(x) = x^2\sin(1/x)$ at $a = 0$, which is zero at every $h = 1/(n\pi)$.

### 3. Spivak's Proof

> [!proof]
> Define
> $$\varphi(h) = \begin{cases}\dfrac{f(g(a+h)) - f(g(a))}{g(a+h) - g(a)} & \text{if } g(a+h) - g(a) \ne 0,\\[2mm] f'(g(a)) & \text{if } g(a+h) - g(a) = 0.\end{cases}$$
> **Claim: $\varphi$ is continuous at $0$**, i.e. $\varphi(h) \to f'(g(a))$. Given $\varepsilon > 0$: since $f$ is differentiable at $g(a)$, there's $\delta' > 0$ with
> $$0 < |k| < \delta' \Rightarrow \left|\frac{f(g(a) + k) - f(g(a))}{k} - f'(g(a))\right| < \varepsilon.$$
> Since $g$ is continuous at $a$, there's $\delta > 0$ with $|h| < \delta \Rightarrow |g(a+h) - g(a)| < \delta'$. Now take $|h| < \delta$. If $k = g(a+h) - g(a) \ne 0$ then $0 < |k| < \delta'$ and $|\varphi(h) - f'(g(a))| < \varepsilon$. If $k = 0$ then $\varphi(h) = f'(g(a))$ exactly. Either way we're within $\varepsilon$.
>
> **Now the identity** $\dfrac{f(g(a+h)) - f(g(a))}{h} = \varphi(h)\cdot\dfrac{g(a+h) - g(a)}{h}$ holds for **all** $h \ne 0$ (when $g(a+h) = g(a)$ both sides are $0$). Take limits: $f'(g(a))\cdot g'(a)$.

The trick: $\varphi$ is the difference quotient of $f$, **patched** to have the right value exactly where the naive version would divide by zero.

### 4. Using It: Work From the Outside In

Write the function as a composition and peel off the outermost function first, evaluating its derivative at whatever is inside. With $S(x) = x^2$:

- $\sin(x^2) = \sin\circ S$: derivative $\cos(x^2)\cdot 2x$.
- $\sin^2 x = S\circ\sin$: derivative $2\sin x\cdot\cos x$. (Matches the product rule on $\sin\cdot\sin$.)
- $\sin(1/x)$: $\cos(1/x)\cdot(-1/x^2)$.
- $(x^3 + 3x^2)^{53}$: $53(x^3 + 3x^2)^{52}(3x^2 + 6x)$. Nobody wants to expand that first.
- **Triple compositions**, e.g. $\sin^2(x^2) = S\circ\sin\circ S$: $2\sin(x^2)\cdot\cos(x^2)\cdot 2x$.
- $\sin(\sin(\sin x))$: $\cos(\sin(\sin x))\cdot\cos(\sin x)\cdot\cos x$.
- $\sin^2(\sin^2 x)$: $2\sin(\sin^2 x)\cdot\cos(\sin^2 x)\cdot 2\sin x\cos x$.

**Rule of thumb (Spivak):** mentally bracket from the right, $f\circ(g\circ(h\circ k))$, write $f'(\text{everything inside})\cdot$, then repeat on what's inside. With practice no thought is necessary.

**General power rule:** $\big(g(x)^n\big)' = n\,g(x)^{n-1}g'(x)$. **Reciprocal rule again** (Problem 10-12): $1/g = R\circ g$ with $R(x) = 1/x$, so $(1/g)' = -\frac{1}{g^2}\cdot g'$.

### 5. Back to $x^2\sin(1/x)$

For $f(x) = x^2\sin(1/x)$, $f(0) = 0$: we showed $f'(0) = 0$ from the definition (Lecture 13). For $x \ne 0$, product + chain rules give
$$f'(x) = 2x\sin\frac1x + x^2\cos\frac1x\cdot\left(-\frac{1}{x^2}\right) = 2x\sin\frac1x - \cos\frac1x.$$
As $x \to 0$, the first term $\to 0$ but $\cos(1/x)$ oscillates, so **$f'$ is not continuous at $0$**. A function can be differentiable everywhere with a discontinuous derivative!

Raising the power improves things one step at a time: $x^3\sin(1/x)$ has $f'$ continuous at $0$ but no $f''(0)$; $x^4\sin(1/x)$ has $f''$ existing but discontinuous at $0$. In general, see Problems 10-31 and 10-32.

### 6. Worked Examples

1. $\dfrac{d}{dx}\sqrt{1 - x^2} = \dfrac{1}{2\sqrt{1-x^2}}\cdot(-2x) = \dfrac{-x}{\sqrt{1 - x^2}}$ on $(-1, 1)$ (Problem 10-13).
2. $\dfrac{d}{dx}\left(\dfrac{x}{1+x^2}\right)^3 = 3\left(\dfrac{x}{1+x^2}\right)^2\cdot\dfrac{1 - x^2}{(1 + x^2)^2}$.
3. **$f$ in terms of $g$** (Problem 10-6): if $f(x) = g(x + g(a))$, then $f'(x) = g'(x + g(a))$, since $g(a)$ is a constant. If $f(x) = g(x\cdot g(a))$, then $f'(x) = g(a)\,g'(x\,g(a))$.
4. **Second derivative via chain rule**: $f(x) = \sin(x^2)$: $f' = 2x\cos(x^2)$, $f'' = 2\cos(x^2) - 4x^2\sin(x^2)$.

### 7. Problems to Try

- **Ch. 10**: 2 (drill), 4 and 5 ($f'(f(x))$ vs. $(f\circ f)'(x)$, which are not the same!), 6, 10, 11, 12, 13, 31, 32, 33 (Leibniz notation for the chain rule).

### Conclusion

The chain rule is $f'$ at the inside times the derivative of the inside. The naive proof fails exactly when $g$ keeps returning to $g(a)$, and Spivak's patched quotient $\varphi$ fixes that. With the sum, product, quotient and chain rules we can now differentiate anything built from functions whose derivatives we know, which so far means polynomials and (on credit) $\sin$ and $\cos$.

## Related

- [[Calc I, Lecture 15: The Product and Quotient Rules]]
- [[Calc I, Lecture 17: Derivatives of the Trigonometric Functions]]
- [[Calc I, Lecture 23: Related Rates]]
- [[Calc I, Lecture 38: Integration by Substitution]]
