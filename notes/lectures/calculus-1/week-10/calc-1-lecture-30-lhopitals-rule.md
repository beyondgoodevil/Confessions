---
id: L-0034
title: "Calc I, Lecture 30: L'Hopital's Rule"
course: Calculus I
lecture: 30
week: 10
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 11 (Theorems 7, 8, 9) and Problems 48-53"
summary: L'Hopital's rule for 0/0 limits with Spivak's proof from the Cauchy Mean Value Theorem, its one-sided, infinite and infinity-over-infinity versions, the classic misuse, and rewriting 0 times infinity and 1 to the infinity forms.
---

**L'Hôpital's rule**: if $f(x) \to 0$ and $g(x) \to 0$ as $x \to a$, and $\dfrac{f'(x)}{g'(x)}$ has a limit, then $\dfrac{f(x)}{g(x)}$ has **the same** limit. It handles the indeterminate forms the limit laws can't. The proof is a direct application of the **Cauchy MVT**. There are also versions for one-sided limits, $x \to \infty$ and $\frac\infty\infty$, and the most common way to misuse it is applying it when the form **isn't** $0/0$. Here's how it works:

### 1. The Theorem

> [!theorem] Spivak Theorem 11-9 (L'Hôpital's rule)
> Suppose $\lim_{x\to a} f(x) = 0$, $\lim_{x\to a} g(x) = 0$, and $\lim_{x\to a}\dfrac{f'(x)}{g'(x)}$ exists. Then $\lim_{x\to a}\dfrac{f(x)}{g(x)}$ exists, and
> $$\lim_{x\to a}\frac{f(x)}{g(x)} = \lim_{x\to a}\frac{f'(x)}{g'(x)}.$$

Hidden in "$\lim f'/g'$ exists": on some punctured interval around $a$, $f'$ and $g'$ **exist** and **$g' \ne 0$**.

> [!proof]
> Redefine $f(a) = g(a) = 0$ if necessary; this doesn't change any limits, and now $f, g$ are continuous at $a$. Take $a < x < a + \delta$.
> - **$g(x) \ne 0$**: otherwise Rolle on $[a, x]$ gives a point where $g' = 0$, which is excluded.
> - **Cauchy MVT on $[a, x]$**: there's $\alpha_x \in (a, x)$ with $[f(x) - 0]g'(\alpha_x) = [g(x) - 0]f'(\alpha_x)$, i.e.
> $$\frac{f(x)}{g(x)} = \frac{f'(\alpha_x)}{g'(\alpha_x)}.$$
> - As $x \to a^+$, $\alpha_x \to a$ (it's squeezed between $a$ and $x$), so the right side tends to $\lim_{y\to a} f'(y)/g'(y)$. The same works for $x < a$.

**Special case (Theorem 11-7)**: if $f$ is continuous at $a$ and $\lim_{x\to a} f'(x)$ exists, then $f'(a)$ exists and equals that limit. (Apply l'Hôpital to $\frac{f(x) - f(a)}{x - a}$.) So **a derivative can't have a jump discontinuity**.

### 2. Other Versions (Problems 11-51, 11-52)

1. **One-sided**: $x \to a^+$ or $a^-$, same statement.
2. **Infinite limit of the ratio**: if $f'/g' \to \infty$, so does $f/g$.
3. **At infinity**: $x \to \infty$ with $f, g \to 0$; prove it by applying the basic rule to $f(1/t)/g(1/t)$ as $t \to 0^+$.
4. **$\frac\infty\infty$**: if $f, g \to \infty$ and $f'/g' \to l$, then $f/g \to l$. This one "requires more than algebraic manipulations" (Spivak). The proof uses Cauchy on $[a, x]$ for large $a$ and then rewrites $\frac{f(x)}{g(x)}$ as $\frac{f(x) - f(a)}{g(x) - g(a)}$ times a factor that tends to $1$.

### 3. The Classic Misuse (Problem 11-48)

$$\lim_{x\to1}\frac{x^3 + x - 2}{x^2 - 3x + 2} \overset{\text{L'H}}{=} \lim_{x\to1}\frac{3x^2 + 1}{2x - 3} \overset{\text{L'H??}}{=} \lim_{x\to1}\frac{6x}{2} = 3.$$
**Wrong.** The first step is fine (both $\to 0$ at $1$). But $\frac{3x^2 + 1}{2x - 3}$ isn't $0/0$ at $x = 1$; it's $\frac{4}{-1}$. So the limit is **$-4$**, by plain continuity. **Always check the form before each application.**

### 4. Worked Examples

1. $\displaystyle\lim_{x\to0}\frac{\sin x}{x} = \lim\frac{\cos x}{1} = 1$. (Logically circular if you're *proving* $\sin' = \cos$, since that used this limit. Fine as a check.)
2. $\displaystyle\lim_{x\to0}\frac{1 - \cos x}{x^2} = \lim\frac{\sin x}{2x} = \frac12$.
3. $\displaystyle\lim_{x\to0}\frac{e^x - 1 - x}{x^2} = \lim\frac{e^x - 1}{2x} = \lim\frac{e^x}{2} = \frac12$ (two applications, each checked $0/0$).
4. $\displaystyle\lim_{x\to0}\frac{x}{\tan x} = \lim\frac{1}{\sec^2 x} = 1$ (Problem 11-49(i)).
5. **$\frac\infty\infty$**: $\displaystyle\lim_{x\to\infty}\frac{\log x}{x} = \lim\frac{1/x}{1} = 0$, and $\displaystyle\lim_{x\to\infty}\frac{x^n}{e^x} = 0$ by $n$ applications (matching Theorem 18-6).
6. **$0\cdot\infty$**: rewrite as a quotient. $\displaystyle\lim_{x\to0^+}x\log x = \lim\frac{\log x}{1/x} = \lim\frac{1/x}{-1/x^2} = \lim(-x) = 0$.
7. **$0^0$, $1^\infty$, $\infty^0$**: take logs. $x^x = e^{x\log x} \to e^0 = 1$ as $x \to 0^+$. And $\left(1 + \frac1x\right)^x = e^{x\log(1 + 1/x)}$, where $x\log(1 + \frac1x) = \frac{\log(1 + 1/x)}{1/x} \to 1$ (L'H or Lecture 22), so the limit is $e$.
8. **When you can't use it twice** (Problem 11-50): $g(0) = g'(0) = 0$, $g''(0) = 17$, and $f(x) = g(x)/x$ for $x \ne 0$, $f(0) = 0$. Then
$$f'(0) = \lim_{h\to0}\frac{g(h)}{h^2} \overset{\text{L'H}}{=} \lim_{h\to0}\frac{g'(h)}{2h} = \frac12 g''(0) = \frac{17}{2}.$$
The last step is the **definition** of $g''(0)$, not another l'Hôpital, because we don't know $g''$ exists near $0$, let alone is continuous.

### 5. Problems to Try

- **Ch. 11**: 48, 49, 50, 51, 52 (prove the $\frac\infty\infty$ version).
- **Ch. 15**: 2 (trig limits by l'Hôpital).
- **Ch. 18**: 5 (exp/log limits).

### Conclusion

L'Hôpital's rule is the Cauchy MVT applied on $[a, x]$: the ratio $f/g$ equals $f'/g'$ at some intermediate point, which is forced toward $a$. It needs a genuine $0/0$ (or $\infty/\infty$) **every time** it's applied, and products, differences and powers have to be rewritten as quotients (often via $\log$) first.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 26: Rolle's Theorem and the Mean Value Theorem]]
- [[Calc I, Lecture 08: The Squeeze Theorem and sin x over x]]
- [[Calc I, Lecture 22: General Exponentials and Logarithmic Differentiation]]
- [[Calc I, Lecture 31: Optimization]]
