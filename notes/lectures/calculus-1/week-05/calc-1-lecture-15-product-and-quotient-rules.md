---
id: L-0019
title: "Calc I, Lecture 15: The Product and Quotient Rules"
course: Calculus I
lecture: 15
week: 5
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 10 (Differentiation), Theorems 4, 7, 8"
summary: Proofs of the product rule (add and subtract), the reciprocal rule and the quotient rule, products of many functions, negative integer powers, and the Leibniz formula for higher derivatives of products.
---

The derivative of a product is **not** the product of the derivatives. Instead $(fg)' = f'g + fg'$, the **product rule**. For quotients, $\left(\frac fg\right)' = \frac{gf' - fg'}{g^2}$, the **quotient rule**. Both proofs use one algebraic trick (**add and subtract the same thing**) plus the fact that differentiable functions are continuous. Here's how it works:

### 1. The Product Rule

> [!theorem] Spivak Theorem 10-4
> If $f$ and $g$ are differentiable at $a$, then $f\cdot g$ is differentiable at $a$ and
> $$(f\cdot g)'(a) = f'(a)\,g(a) + f(a)\,g'(a).$$

> [!proof]
> Add and subtract $f(a+h)g(a)$ in the numerator:
> $$\frac{f(a+h)g(a+h) - f(a)g(a)}{h} = f(a+h)\cdot\frac{g(a+h) - g(a)}{h} + \frac{f(a+h) - f(a)}{h}\cdot g(a).$$
> As $h \to 0$: $f(a+h) \to f(a)$ (**Theorem 9-1**: differentiable ⇒ continuous), the first quotient $\to g'(a)$, the second $\to f'(a)$. So the limit is $f(a)g'(a) + f'(a)g(a)$.

The continuity step is easy to forget, but without it you can't pass to the limit in $f(a+h)$.

**Sanity check:** $(x\cdot x)' = 1\cdot x + x\cdot 1 = 2x$. ✓ And $(cf)' = 0\cdot f + c f' = cf'$, which is Theorem 10-5.

**Many factors** (by applying the rule twice):
$$(fgh)' = f'gh + fg'h + fgh',$$
i.e. differentiate one factor at a time and add. In general $(f_1\cdots f_n)' = \sum_{i} f_1\cdots f_i'\cdots f_n$ (induction).

### 2. The Reciprocal Rule

> [!theorem] Spivak Theorem 10-7
> If $g$ is differentiable at $a$ and $g(a) \ne 0$, then $1/g$ is differentiable at $a$ and
> $$\left(\frac1g\right)'(a) = \frac{-g'(a)}{[g(a)]^2}.$$

> [!proof]
> **First, make sure $1/g$ is even defined near $a$:** $g$ is continuous at $a$ (Theorem 9-1) and $g(a) \ne 0$, so by Theorem 6-3, $g(a+h) \ne 0$ for small $|h|$. Then
> $$\frac{\frac{1}{g(a+h)} - \frac{1}{g(a)}}{h} = -\frac{g(a+h) - g(a)}{h}\cdot\frac{1}{g(a)\,g(a+h)} \to -g'(a)\cdot\frac{1}{g(a)^2},$$
> using continuity of $g$ at $a$ once more.

### 3. The Quotient Rule

> [!theorem] Spivak Theorem 10-8
> If $f, g$ are differentiable at $a$ and $g(a) \ne 0$, then
> $$\left(\frac fg\right)'(a) = \frac{g(a)f'(a) - f(a)g'(a)}{[g(a)]^2}.$$

> [!proof]
> $\frac fg = f\cdot\frac1g$, so by the product and reciprocal rules
> $$\left(\frac fg\right)' = \frac{f'}{g} + f\cdot\frac{-g'}{g^2} = \frac{gf' - fg'}{g^2}.$$

Spivak's mnemonic: "bottom times derivative of top, minus top times derivative of bottom, over bottom squared". **The order in the numerator matters** (it's a minus sign).

### 4. Negative Powers

For $n \in \mathbb{N}$ and $x \ne 0$:
$$\left(x^{-n}\right)' = \left(\frac{1}{x^n}\right)' = \frac{-nx^{n-1}}{x^{2n}} = -nx^{-n-1}.$$
So **the power rule holds for all integers** (with the $n = 0$ case interpreted as $1' = 0$). Problem 10-28 pushes this to $k$th derivatives: $(x^{-n})^{(k)} = (-1)^k\dfrac{(n+k-1)!}{(n-1)!}x^{-n-k}$.

### 5. Worked Examples

1. $\displaystyle f(x) = \frac{x^2 - 1}{x^2 + 1}$: $f'(x) = \frac{(x^2+1)(2x) - (x^2-1)(2x)}{(x^2+1)^2} = \frac{4x}{(x^2+1)^2}$.
2. $\displaystyle f(x) = \frac{x}{x^2 + 1}$: $f'(x) = \frac{(x^2 + 1) - x(2x)}{(x^2+1)^2} = \frac{1 - x^2}{(x^2+1)^2}$. Horizontal tangents at $x = \pm1$.
3. **With trig** (taking $\sin' = \cos$, $\cos' = -\sin$ on faith until Lecture 17, as Spivak does in Ch. 10): $(x\sin x)' = \sin x + x\cos x$, and $(\sin^2 x)' = 2\sin x\cos x$, $(\cos^2 x)' = -2\sin x\cos x$. These add to $0$, as they must, since $\sin^2 + \cos^2 = 1$.
4. $(x^3\sin x\cos x)' = 3x^2\sin x\cos x + x^3\cos^2 x - x^3\sin^2 x$ (three-factor rule).
5. **$\tan$** (Problem 10-3): $\tan = \frac{\sin}{\cos}$, so $\tan' = \frac{\cos\cdot\cos - \sin\cdot(-\sin)}{\cos^2} = \frac{1}{\cos^2} = \sec^2$.

### 6. Leibniz's Formula

> [!theorem] Problem 10-18
> $$(f\cdot g)^{(n)}(a) = \sum_{k=0}^{n}\binom nk f^{(k)}(a)\,g^{(n-k)}(a).$$

It's the binomial theorem in disguise, and the proof is the same induction (use $\binom nk + \binom n{k-1} = \binom{n+1}k$). E.g. $(fg)'' = f''g + 2f'g' + fg''$.

### 7. Problems to Try

- **Ch. 10**: 1, 2 (big differentiation drill; Spivak notes it took him 20 minutes), 3 ($\tan$, $\cot$, $\sec$, $\csc$), 12 ($(1/g)'$ via the chain rule, after Lecture 16), 15, 16 ($|f|$ is differentiable where $f \ne 0$), 18 (Leibniz formula), 28.

### Conclusion

The product rule comes from adding and subtracting $f(a+h)g(a)$, and the reciprocal rule from a common denominator. Both need continuity of differentiable functions. The quotient rule follows from the two, and with it the power rule extends to negative integers and every rational function can be differentiated. That leaves composition.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 14: Sum, Constant Multiple and Power Rules]]
- [[Calc I, Lecture 16: The Chain Rule]]
- [[Calc I, Lecture 17: Derivatives of the Trigonometric Functions]]
