---
id: L-0016
title: "Calc I, Lecture 13: Differentiability and Higher Derivatives"
course: Calculus I
lecture: 13
week: 5
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 9 (Derivatives), Theorem 1 and examples"
summary: Where derivatives fail to exist (corners, vertical tangents, oscillation), why differentiable implies continuous but not conversely, the x squared sin(1/x) example, and second and higher derivatives.
---

**Differentiability is strictly stronger than continuity.** Every differentiable function is continuous, but continuous functions can fail to be differentiable at **corners** ($|x|$), **vertical tangents** ($\sqrt[3]x$) or through **oscillation** ($x\sin(1/x)$). Taking derivatives of derivatives gives **higher derivatives**, a still finer measure of how well behaved a function is. Here's how it works:

### 1. Ways a Derivative Can Fail to Exist

1. **Corner: $f(x) = |x|$ at $0$.** $\frac{f(h) - f(0)}{h} = \frac{|h|}{h}$, which is $1$ for $h > 0$ and $-1$ for $h < 0$. The **right-hand derivative** is $1$ and the **left-hand derivative** is $-1$, so there's no two-sided limit. Elsewhere $f'(x) = 1$ for $x > 0$ and $-1$ for $x < 0$.
2. **Mismatched pieces: $f(x) = x^2$ for $x \le 0$, $x$ for $x \ge 0$.** Left derivative at $0$ is $\lim_{h\to0^-} h^2/h = 0$, right derivative is $1$. Not differentiable at $0$, even though it's continuous.
3. **Cusp: $f(x) = \sqrt{|x|}$ at $0$.** The quotient is $\frac{1}{\sqrt h}$ for $h > 0$ (→ $+\infty$) and $-\frac{1}{\sqrt{-h}}$ for $h < 0$ (→ $-\infty$).
4. **Vertical tangent: $f(x) = \sqrt[3]{x}$ at $0$.** $\frac{h^{1/3}}{h} = \frac{1}{h^{2/3}} \to +\infty$. People say "infinite derivative": the graph has a vertical tangent line. Still not differentiable.
5. **Oscillation: $f(x) = x\sin(1/x)$, $f(0) = 0$.** $\frac{f(h) - f(0)}{h} = \sin(1/h)$, which has no limit (Lecture 5). The secant slopes through the origin take every value in $[-1, 1]$ however small $h$ is.

Even worse: there are functions **continuous everywhere and differentiable nowhere**. Spivak constructs one in Ch. 24, and the graph is undrawable.

### 2. Differentiable Implies Continuous

> [!theorem] Spivak Theorem 9-1
> If $f$ is differentiable at $a$, then $f$ is continuous at $a$.

> [!proof]
> $$\lim_{h\to0}\big[f(a+h) - f(a)\big] = \lim_{h\to0}\frac{f(a+h) - f(a)}{h}\cdot h = f'(a)\cdot 0 = 0,$$
> and $\lim_{h\to0} f(a+h) = f(a)$ is the same as $\lim_{x\to a} f(x) = f(a)$.

The converse is **false**: think of $|x|$ and you'll never mix them up.

### 3. $x^2\sin(1/x)$: Differentiable, but Barely

Let $g(x) = x^2\sin(1/x)$ for $x \ne 0$, $g(0) = 0$. Then
$$\frac{g(h) - g(0)}{h} = h\sin\frac1h \to 0,$$
by the squeeze theorem (Lecture 8). So **$g'(0) = 0$**, and the tangent at the origin is the $x$-axis, even though the graph wiggles infinitely often near $0$. Lesson: differentiability alone doesn't rule out bad behaviour. In Lecture 16 we'll see that $g'$ **isn't continuous** at $0$.

> [!theorem] Generalization (Problems 9-14, 9-15)
> If $|f(x)| \le x^2$ for all $x$, then $f$ is differentiable at $0$ with $f'(0) = 0$.

> [!proof]
> $f(0) = 0$ is forced, and $\left|\frac{f(h)}{h}\right| \le |h| \to 0$.

So even $f(x) = x^2$ on $\mathbb{Q}$, $0$ off $\mathbb{Q}$ is differentiable at $0$ (Problem 9-14), and it's discontinuous everywhere else!

### 4. Higher Derivatives

> [!definition]
> $f'' = (f')'$ is the **second derivative**; if $f''(a)$ exists, $f$ is **twice differentiable at $a$**. In general $f^{(k+1)} = (f^{(k)})'$, with $f^{(1)} = f'$ and $f^{(0)} = f$. Leibniz: $f''(x) = \dfrac{d^2 f(x)}{dx^2}$.

Physically, if $s$ is position then $s'$ is velocity and $s''$ is **acceleration**.

- **$f(x) = x^2$**: $f' = 2x$, $f'' = 2$, $f^{(k)} = 0$ for $k \ge 3$.
- **$f(x) = x|x|$** (that is, $x^2$ for $x \ge 0$ and $-x^2$ for $x \le 0$): $f'(x) = 2|x|$. Check at $0$: $\frac{f(h)}{h} = |h| \to 0$. But $f' = 2|x|$ has a corner, so **$f''(0)$ does not exist**. A "smooth-looking" function revealed as irregular by the second derivative.
- Problem 9-29: $x^n$ for $x \ge 0$, $0$ for $x \le 0$ has $f^{(n-1)}$ everywhere but no $f^{(n)}(0)$.

### 5. Worked Examples

1. **Is $f(x) = |x - 2| + x^2$ differentiable at $2$?** Left derivative: $-1 + 4 = 3$; right derivative: $1 + 4 = 5$. No.
2. **Choose $a, b$ so that $f(x) = x^2$ ($x \le 1$), $ax + b$ ($x > 1$) is differentiable at $1$.** Continuity: $a + b = 1$. Matching one-sided derivatives (Problem 9-13 justifies this): $2 = a$. So $a = 2$, $b = -1$, which is just the tangent line glued on.
3. **Derivatives of even/odd functions** (Problems 9-23, 9-24): if $f$ is even then $f'$ is odd, and vice versa. E.g. $(x^2)' = 2x$, $(x^3)' = 3x^2$.

### 6. Problems to Try

- **Ch. 9**: 5 ($[x]'$), 13 (gluing with matching one-sided derivatives), 14, 15, 16, 17 (powers $|x|^\alpha$ and differentiability at $0$), 25, 28 ($|x|^3$: how many derivatives?), 29.

### Conclusion

Continuity is necessary for differentiability but nowhere near sufficient. Corners, vertical tangents and oscillation all kill the derivative, while $x^2\sin(1/x)$ shows a function can be differentiable and still badly behaved. Higher derivatives measure smoothness more finely, and $x|x|$ already fails at the second step.

## Related

- [[Calc I, Lecture 12: The Derivative]]
- [[Calc I, Lecture 14: Sum, Constant Multiple and Power Rules]]
- [[Calc I, Lecture 09: Continuity]]
