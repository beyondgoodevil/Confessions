---
id: L-0011
title: "Calc I, Lecture 08: The Squeeze Theorem and sin x over x"
course: Calculus I
lecture: 8
week: 3
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 5 (Problems 13, 15, 21, 35) and Ch. 15 (Problem 27)"
summary: The squeeze theorem with proof, the bounded-times-vanishing trick, and the geometric proof that sin x over x goes to 1, plus the limits that follow from it.
---

The **squeeze theorem** says that if $f \le g \le h$ near $a$ and $f$ and $h$ have the same limit $l$, then $g$ is forced to have limit $l$ too. It's the tool for limits the algebraic laws can't reach: $x\sin(1/x) \to 0$, and the most important trig limit in the course, $\displaystyle\lim_{x\to0}\frac{\sin x}{x} = 1$, which is what makes $\sin' = \cos$ (Lecture 17). Here's how it works:

### 1. The Squeeze Theorem

> [!theorem] Squeeze theorem (Spivak Problem 5-13)
> If $f(x) \le g(x) \le h(x)$ for all $x$ near $a$ (except possibly at $a$), and $\lim_{x\to a} f(x) = \lim_{x\to a} h(x) = l$, then $\lim_{x\to a} g(x) = l$.

> [!proof]
> Given $\varepsilon > 0$, pick $\delta$ small enough that for $0 < |x - a| < \delta$ the inequalities $f \le g \le h$ hold, $l - \varepsilon < f(x)$, and $h(x) < l + \varepsilon$ (take the min of three δ's). Then
> $$l - \varepsilon < f(x) \le g(x) \le h(x) < l + \varepsilon,$$
> so $|g(x) - l| < \varepsilon$.

"Draw a picture!" (Spivak's hint): $g$'s graph is trapped in a funnel that pinches to the point $(a, l)$.

### 2. Bounded Times Vanishing

> [!theorem] Problem 5-21
> If $\lim_{x\to a} g(x) = 0$ and $|h(x)| \le M$ for all $x$ near $a$, then $\lim_{x\to a} g(x)h(x) = 0$.

Proof: $-M|g(x)| \le g(x)h(x) \le M|g(x)|$, and both bounds $\to 0$. Squeeze.

**Examples:**
- $x \sin(1/x) \to 0$ as $x \to 0$ (here $g(x) = x$, $h = \sin(1/x)$, $M = 1$).
- $x^2 \cos(1/x^3) \to 0$.
- $\dfrac{\sin x}{x} \to 0$ as $x \to \infty$: $|\sin x| \le 1$ and $1/x \to 0$.

> [!note] Common mistake
> You can't use the product law on $x \sin(1/x)$, because $\lim \sin(1/x)$ doesn't exist. The squeeze theorem only needs a **bound** on the bad factor, not a limit.

### 3. The Limit $\sin x / x$

> [!theorem]
> $$\lim_{x\to0}\frac{\sin x}{x} = 1.$$

> [!proof] The classical geometric proof (Spivak Problem 15-27)
> Take $0 < x < \pi/2$ and the point $B = (\cos x, \sin x)$ on the unit circle. Compare three areas:
> - the triangle with vertices $O$, $(1, 0)$, $B$: area $\tfrac12 \sin x$;
> - the **sector** of angle $x$: area $\tfrac{x}{2}$ (this is the definition of radian measure: the sector of angle $x$ is $x/2\pi$ of the whole disc, which has area $\pi$);
> - the right triangle with vertices $O$, $(1, 0)$, $(1, \tan x)$: area $\tfrac12 \tan x$.
>
> They're nested, so
> $$\frac{\sin x}{2} < \frac x2 < \frac{\sin x}{2\cos x}.$$
> Divide by $\tfrac{\sin x}{2} > 0$ and take reciprocals:
> $$\cos x < \frac{\sin x}{x} < 1.$$
> As $x \to 0^+$, $\cos x \to 1$, so by squeeze $\frac{\sin x}{x} \to 1$ from the right. And $\frac{\sin x}{x}$ is **even** ($\frac{\sin(-x)}{-x} = \frac{\sin x}{x}$), so the left-hand limit is the same.

**Honesty note:** this uses "sector area $= x/2$" and $\cos x \to 1$, which we're taking from geometry for now. In Spivak, Ch. 15 actually *defines* $\cos$ and $\sin$ through exactly this sector area, so the argument is made rigorous there, and the limit comes out as $\sin'(0) = \cos 0 = 1$.

### 4. Consequences

1. **$\displaystyle\lim_{x\to0}\frac{1 - \cos x}{x} = 0$.** Multiply by $1 + \cos x$:
$$\frac{1 - \cos x}{x} = \frac{1 - \cos^2 x}{x(1 + \cos x)} = \frac{\sin x}{x}\cdot\frac{\sin x}{1 + \cos x} \to 1\cdot\frac{0}{2} = 0.$$
2. **$\displaystyle\lim_{x\to0}\frac{1 - \cos x}{x^2} = \frac12$** (same trick: $\frac{\sin^2 x}{x^2}\cdot\frac{1}{1 + \cos x}$).
3. **Rescaling** (Problem 5-14): if $\lim_{x\to0} f(x)/x = l$ and $b \ne 0$, then $\lim f(bx)/x = bl$. So $\displaystyle\lim_{x\to0}\frac{\sin 2x}{x} = 2$ (write it as $2\cdot\frac{\sin 2x}{2x}$).
4. $\displaystyle\lim_{x\to0}\frac{\tan x}{x} = \lim\frac{\sin x}{x}\cdot\frac{1}{\cos x} = 1$.
5. $\displaystyle\lim_{x\to0}\frac{\sin^2 x}{x} = \lim \frac{\sin x}{x}\cdot\sin x = 0$, and $\displaystyle\lim_{x\to0}\frac{\sin(x^2)}{x} = \lim\frac{\sin(x^2)}{x^2}\cdot x = 0$.
6. $\displaystyle\lim_{x\to\infty} x\sin\frac1x = 1$ (substitute $t = 1/x$, as in Problem 5-34).

Spivak's Problems 5-15 and 5-35 do these with $\alpha = \lim \frac{\sin x}{x}$ left as an unknown, which is a nice check that you only used the algebra and not the value.

### 5. Problems to Try

- **Ch. 5**: 13 (prove squeeze), 14, 15 and 35 (limits in terms of $\alpha$), 21 (bounded × vanishing, plus its generalization).
- **Ch. 15**: 27 (a)–(c) (the geometric argument and $(1 - \cos x)/x$).

### Conclusion

The squeeze theorem handles limits where one factor has no limit but is bounded, and with three nested areas it gives $\sin x / x \to 1$. That one limit, together with $(1 - \cos x)/x \to 0$, is everything we'll need to differentiate the trig functions.

## Related

- [[Calc I, Lecture 07: One-Sided Limits and Limits at Infinity]]
- [[Calc I, Lecture 09: Continuity]]
- [[Calc I, Lecture 17: Derivatives of the Trigonometric Functions]]
