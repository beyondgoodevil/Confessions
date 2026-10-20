---
id: L-0017
title: "Calc I, Lecture 14: Sum, Constant Multiple and Power Rules"
course: Calculus I
lecture: 14
week: 5
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 10 (Differentiation), Theorems 1-3, 5, 6"
summary: The first differentiation theorems, for constants, the identity, sums and constant multiples, then the power rule by induction and the derivatives of every polynomial.
---

Computing every derivative from the definition is miserable. **Differentiation** becomes mechanical once we have theorems for the building blocks: constants and $x$, then **sums**, **constant multiples** and **powers**. Together they give the derivative of **every polynomial** without a single limit. Here's how it works:

### 1. The Two Atoms

> [!theorem] Spivak Theorems 10-1, 10-2
> If $f(x) = c$, then $f'(a) = 0$. If $f(x) = x$, then $f'(a) = 1$.

Both are one-line computations from Lecture 12.

### 2. Sums

> [!theorem] Spivak Theorem 10-3 (Sum rule)
> If $f$ and $g$ are differentiable at $a$, then so is $f + g$, and $(f + g)'(a) = f'(a) + g'(a)$.

> [!proof]
> $$\frac{(f+g)(a+h) - (f+g)(a)}{h} = \frac{f(a+h) - f(a)}{h} + \frac{g(a+h) - g(a)}{h} \to f'(a) + g'(a),$$
> by the sum law for limits.

### 3. Constant Multiples

> [!theorem] Spivak Theorem 10-5
> If $g(x) = c\,f(x)$ and $f$ is differentiable at $a$, then $g'(a) = c\,f'(a)$.

Spivak proves this as a special case of the product rule (next lecture), but directly it's just $\frac{cf(a+h) - cf(a)}{h} = c\cdot\frac{f(a+h) - f(a)}{h}$. Consequence: $(f - g)' = f' - g'$.

So differentiation is **linear**: $(\alpha f + \beta g)' = \alpha f' + \beta g'$.

### 4. The Power Rule

> [!theorem] Spivak Theorem 10-6
> If $f(x) = x^n$ for a natural number $n$, then $f'(a) = na^{n-1}$ for all $a$.

> [!proof] By induction on $n$
> $n = 1$ is Theorem 10-2. Assume it for $n$, and let $g(x) = x^{n+1} = x^n \cdot x$. By the **product rule** (Theorem 10-4, next lecture):
> $$g'(a) = na^{n-1}\cdot a + a^n \cdot 1 = (n+1)a^n.$$

If you'd rather not borrow the product rule, the binomial theorem works directly:
$$\frac{(a+h)^n - a^n}{h} = na^{n-1} + \binom n2 a^{n-2}h + \cdots + h^{n-1} \to na^{n-1}.$$

**Extensions coming up:** $n = 0$ (interpret $x^0 = 1$, derivative $0$), negative integers (Lecture 15, via the quotient rule), rational exponents (Lecture 19, via inverse functions), and arbitrary real exponents (Lecture 22, via $x^a = e^{a\log x}$). The answer is always $ax^{a-1}$.

### 5. Polynomials

Combining linearity and the power rule:
$$f(x) = a_nx^n + \cdots + a_1x + a_0 \;\Rightarrow\; f'(x) = na_nx^{n-1} + (n-1)a_{n-1}x^{n-2} + \cdots + a_1.$$

Keep differentiating:
- each derivative lowers the degree by one and kills the constant term;
- $f^{(n)}(x) = n!\,a_n$ (a constant);
- $f^{(k)} = 0$ for $k > n$.

More precisely (Problem 9-27): if $S_n(x) = x^n$ and $0 \le k \le n$, then $S_n^{(k)}(x) = \dfrac{n!}{(n-k)!}x^{n-k}$.

**Cute consequence:** $a_k = \dfrac{f^{(k)}(0)}{k!}$, so the coefficients of a polynomial are determined by its derivatives at $0$. This is the seed of **Taylor polynomials** (Spivak Ch. 20, Calc II).

### 6. Worked Examples

1. $f(x) = 5x^6 + 137x^4 - \pi$: $f'(x) = 30x^5 + 548x^3$; $f''(x) = 150x^4 + 1644x^2$.
2. **Tangent to $y = x^3 - 3x$ at $x = 2$**: $y' = 3x^2 - 3$, so the slope is $9$; the point is $(2, 2)$; the line is $y = 9x - 16$.
3. **Where is the tangent to $y = x^3 - 3x$ horizontal?** $3x^2 - 3 = 0 \Rightarrow x = \pm1$, i.e. at $(1, -2)$ and $(-1, 2)$. (These turn out to be a local min and max in Lecture 27.)
4. **Antiderivatives of polynomials** (Problem 10-20(a)): find $g$ with $g' = a_nx^n + \cdots + a_0$. Take $g(x) = \frac{a_n}{n+1}x^{n+1} + \cdots + a_0x$. Another one: add any constant. (That these are **all** of them needs the Mean Value Theorem, Lecture 27.)
5. **Double roots** (Problem 10-22): $a$ is a double root of polynomial $f$ (i.e. $(x - a)^2 \mid f$) iff $f(a) = f'(a) = 0$. E.g. $x^3 - 3x + 2 = (x - 1)^2(x + 2)$, and indeed $f(1) = 0$, $f'(1) = 3 - 3 = 0$.

### 7. Problems to Try

- **Ch. 9**: 4 (conjecture and prove $S_n'$), 26, 27.
- **Ch. 10**: 1 (warm-up differentiation), 20 (antiderivatives of polynomials), 21, 22 (double roots), 23.

### Conclusion

The sum and constant-multiple rules make differentiation linear, and the power rule, proved by induction, handles $x^n$. Together they differentiate every polynomial on sight. What's still missing are products, quotients and compositions, which come over the next two lectures.

## Related

- [[Calc I, Lecture 13: Differentiability and Higher Derivatives]]
- [[Calc I, Lecture 15: The Product and Quotient Rules]]
- [[Calc I, Lecture 33: Antiderivatives]]
