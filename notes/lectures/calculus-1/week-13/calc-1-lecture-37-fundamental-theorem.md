---
id: L-0040
title: "Calc I, Lecture 37: The Fundamental Theorem of Calculus"
course: Calculus I
lecture: 37
week: 13
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 14 (The Fundamental Theorem of Calculus), Theorems 1, 2 and Corollary"
summary: The derivative of the area function is the integrand (first FTC), integrals are evaluated by any primitive (corollary and second FTC), areas between curves, and differentiating integrals with variable limits via the chain rule.
---

The **Fundamental Theorem of Calculus** connects the two halves of the course. **(1)** If $f$ is continuous, the area function $F(x) = \int_a^x f$ is differentiable with **$F' = f$**: integration is undone by differentiation. **(2)** So if $g$ is any primitive of $f$, then **$\int_a^b f = g(b) - g(a)$**: definite integrals are computed by antiderivatives instead of sums. Spivak is careful to say this is a **theorem about** integrals, not their **definition**. Here's how it works:

### 1. The First Fundamental Theorem

> [!theorem] Spivak Theorem 14-1 (First FTC)
> Let $f$ be integrable on $[a, b]$ and $F(x) = \int_a^x f$. If $f$ is **continuous at $c$**, then $F$ is differentiable at $c$ and $F'(c) = f(c)$.

> [!proof]
> For $h > 0$, $F(c + h) - F(c) = \int_c^{c+h} f$. Let $m_h$, $M_h$ be the inf and sup of $f$ on $[c, c + h]$. By Theorem 13-7,
> $$m_h\cdot h \le \int_c^{c+h}f \le M_h\cdot h \quad\Rightarrow\quad m_h \le \frac{F(c + h) - F(c)}{h} \le M_h.$$
> The same inequality holds for $h < 0$ (two sign flips cancel). Since $f$ is continuous at $c$, both $m_h \to f(c)$ and $M_h \to f(c)$ as $h \to 0$. Squeeze: $F'(c) = f(c)$.

- Picture: $F(c + h) - F(c)$ is a thin strip of width $h$ and height about $f(c)$.
- **Lower limit varying**: $G(x) = \int_x^b f = \int_a^b f - \int_a^x f$, so $G'(c) = -f(c)$.
- **Every continuous function has a primitive**, namely $\int_a^x f$. That's where the primitives of $1/x$ ($\log$, Lecture 39) and of $e^{-x^2}$ (which has no formula) come from.

### 2. Evaluating Integrals

> [!theorem] Spivak's Corollary to 14-1
> If $f$ is continuous on $[a, b]$ and $f = g'$ for some $g$, then $\displaystyle\int_a^b f = g(b) - g(a)$.

> [!proof]
> $F(x) = \int_a^x f$ also satisfies $F' = f = g'$ on $[a, b]$, so $F = g + c$ (Corollary 11-2). At $x = a$: $0 = F(a) = g(a) + c$, so $c = -g(a)$. At $x = b$: $\int_a^b f = F(b) = g(b) - g(a)$.

> [!theorem] Spivak Theorem 14-2 (Second FTC)
> If $f$ is **integrable** on $[a, b]$ and $f = g'$, then $\int_a^b f = g(b) - g(a)$.

> [!proof]
> Here $f$ needn't be continuous, so the area function can't be used. Instead, for any partition, the **MVT** on each piece gives $x_i \in (t_{i-1}, t_i)$ with $g(t_i) - g(t_{i-1}) = f(x_i)(t_i - t_{i-1})$, which lies between $m_i(t_i - t_{i-1})$ and $M_i(t_i - t_{i-1})$. Summing, the sum **telescopes**:
> $$L(f, P) \le g(b) - g(a) \le U(f, P)$$
> for every $P$, and the integral is the only such number.

**Notation:** $g(x)\Big|_a^b = g(b) - g(a)$.

> [!note] Not a definition
> Spivak hammers this: $\int_a^b f$ is **not defined** as "$g(b) - g(a)$ where $g' = f$". That "definition" would be wrong (integrable functions needn't be derivatives, e.g. a one-point spike) and useless (for most $f$ the only primitive we know **is** $\int_a^x f$).

### 3. Worked Examples

1. $\displaystyle\int_a^b x^n\,dx = \frac{b^{n+1} - a^{n+1}}{n + 1}$ ($n \ne -1$; if $n < 0$, $a$ and $b$ must have the same sign). No more sums! Compare the work in Lecture 34.
2. $\displaystyle\int_0^\pi\sin x\,dx = -\cos x\Big|_0^\pi = 1 - (-1) = 2$.
3. $\displaystyle\int_0^1\frac{dx}{1 + x^2} = \arctan 1 - \arctan 0 = \frac\pi4$.
4. $\displaystyle\int_1^e\frac{dx}{x} = \log e - \log 1 = 1$, which is just the definition of $e$ (Lecture 21).
5. **Signed vs. actual area**: for $a < 0 < b$, $\int_a^b x^3\,dx = \frac{b^4 - a^4}{4}$, but the actual area is $-\int_a^0 x^3 + \int_0^b x^3 = \frac{a^4 + b^4}{4}$. Split at the zeros.

### 4. Areas Between Curves

If $g \le f$ on $[a, b]$, the area between them is $\int_a^b (f - g)$, even if they go negative (shift both up by a constant: the area doesn't change and the constants cancel).

1. **$x^2$ and $x^3$ on $[0, 1]$**: $x^3 \le x^2$ there, so the area is $\int_0^1(x^2 - x^3)\,dx = \frac13 - \frac14 = \frac1{12}$.
2. **$x^3 - x$ and $x^2$** (Spivak's example). They meet where $x(x^2 - x - 1) = 0$: $x = 0, \frac{1 \pm \sqrt5}{2}$. Test points show $x^3 - x \ge x^2$ on $\left[\frac{1 - \sqrt5}{2}, 0\right]$ and $x^2 \ge x^3 - x$ on $\left[0, \frac{1 + \sqrt5}{2}\right]$. So
$$\text{area} = \int_{\frac{1-\sqrt5}{2}}^0(x^3 - x - x^2)\,dx + \int_0^{\frac{1+\sqrt5}{2}}(x^2 - x^3 + x)\,dx \approx 0.0758 + 1.0075 = \frac{13}{12}.$$
(The hard part is figuring out the region, which Spivak notes is often where the ingenuity goes.)

```plot
x: -1.2, 2.2
y: -1.5, 3.5
f(x) = x^3 - x | $x^3 - x$
g(x) = x^2 | $x^2$
area: f(x), g(x), (1 - sqrt(5))/2..0 | left piece | green
area: g(x), f(x), 0..(1 + sqrt(5))/2 | right piece | orange
caption: Spivak's example. The legend integrates each piece numerically: they add up to $\frac{13}{12} \approx 1.083$.
```

### 5. Differentiating Integrals: FTC + Chain Rule

$F(x) = \int_a^x h$ is just another function, so it composes like any other (Spivak works these at the end of §14):

1. $\dfrac{d}{dx}\displaystyle\int_a^{x^3}\frac{dt}{1 + \sin^2 t} = \frac{1}{1 + \sin^2(x^3)}\cdot 3x^2$ (outer function $F$, inner $x^3$).
2. $\dfrac{d}{dx}\displaystyle\int_{x^3}^a\frac{dt}{1 + \sin^2 t} = -\frac{3x^2}{1 + \sin^2(x^3)}$.
3. **Both limits variable** (Problem 14-21): $\dfrac{d}{dx}\displaystyle\int_{g(x)}^{f(x)}h = h(f(x))f'(x) - h(g(x))g'(x)$.
4. $\dfrac{d}{dx}\displaystyle\int_0^x e^{-t^2}\,dt = e^{-x^2}$, a perfectly good derivative of a function with no elementary formula.
5. **Find $g$ with $\int_0^x t\,g(t)\,dt = x + x^2$** (Problem 14-6): differentiate: $x\,g(x) = 1 + 2x$, so $g(x) = \frac1x + 2$ for $x \ne 0$. $g$ itself blows up at $0$, but the integrand $t\,g(t) = 1 + 2t$ is perfectly fine, and $\int_0^x(1 + 2t)\,dt = x + x^2$ checks.

### 6. Problems to Try

- **Ch. 14**: 1 (derivatives of integral-defined functions), 2, 4 (expressions independent of $x$), 6, 7, 14 (find $f$ with $f'(x) = \frac{1}{1 + \sin^2 x}$: don't misread "find"), 16, 21.
- **Ch. 13**: 8 (areas between graphs).

### Conclusion

Integrating then differentiating gives back $f$ (first FTC, a squeeze between inf and sup on a thin strip). So any primitive evaluates an integral: $\int_a^b f = g(b) - g(a)$, proved for continuous $f$ through the area function and for merely integrable $f$ through the MVT and telescoping. Areas, averages and accumulated change are now computable, and the area function is a new source of functions.

## Related

- [[Calc I, Lecture 36: Properties of the Integral and Riemann Sums]]
- [[Calc I, Lecture 33: Antiderivatives]]
- [[Calc I, Lecture 38: Integration by Substitution]]
- [[Calc I, Lecture 26: Rolle's Theorem and the Mean Value Theorem]]
