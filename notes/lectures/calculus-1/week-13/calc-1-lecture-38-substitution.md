---
id: L-0041
title: "Calc I, Lecture 38: Integration by Substitution"
course: Calculus I
lecture: 38
week: 13
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 19 (Integration in Elementary Terms), Theorem 2 and Problems 2, 23, 24"
summary: The substitution formula as the chain rule run backwards, its proof, the u = g(x), du = g'(x) dx shorthand, changing limits, substituting x in terms of u, and symmetry tricks.
---

The **substitution formula** is the **chain rule in reverse**:
$$\int_{g(a)}^{g(b)} f(u)\,du = \int_a^b f(g(x))\,g'(x)\,dx.$$
In practice: spot an inner function $g(x)$ whose **derivative is also present**, set **$u = g(x)$, $du = g'(x)\,dx$**, and the integral becomes simpler. Spivak calls it the most important method of integration, and also the one that needs the most ingenuity. Here's how it works:

### 1. The Theorem

> [!theorem] Spivak Theorem 19-2 (Substitution)
> If $f$ and $g'$ are continuous, then
> $$\int_{g(a)}^{g(b)} f(u)\,du = \int_a^b f(g(x))\,g'(x)\,dx.$$

> [!proof]
> Let $F$ be a primitive of $f$ (exists by the FTC since $f$ is continuous). By the chain rule, $(F\circ g)' = (f\circ g)\cdot g'$, so $F\circ g$ is a primitive of the right-hand integrand. By the FTC both sides equal $F(g(b)) - F(g(a))$.

That's the whole proof: **every substitution is a chain-rule computation read backwards.**

### 2. The Mechanical Version

To go from right to left: **replace $g(x)$ by $u$ and $g'(x)\,dx$ by $du$, and change the limits** from $a, b$ to $g(a), g(b)$. Spivak's shorthand is "let $u = g(x)$, $du = g'(x)\,dx$". For **indefinite** integrals:

1. Let $u = g(x)$, $du = g'(x)\,dx$; afterwards **only $u$** should appear.
2. Find a primitive in terms of $u$.
3. **Substitute back** $u = g(x)$.

In Leibniz notation it reads $\int f(u)\,du = \int f(u)\frac{du}{dx}\,dx$, which Spivak says reads particularly well "with a little fudging". It's suggestive, but the theorem above is the actual justification.

### 3. Worked Examples (Spivak's and Similar)

1. $\int\sin^5x\cos x\,dx$: $u = \sin x$, $du = \cos x\,dx$, giving $\int u^5\,du = \frac{u^6}{6} = \frac{\sin^6x}{6}$.
2. $\int\tan x\,dx = \int\frac{\sin x}{\cos x}dx$: $u = \cos x$, $du = -\sin x\,dx$, giving $-\int\frac{du}{u} = -\log|\cos x|$.
3. $\int\frac{dx}{x\log x}$: $u = \log x$, $du = \frac{dx}{x}$, giving $\int\frac{du}{u} = \log|\log x|$.
4. $\int\frac{x}{1 + x^2}dx$: $u = 1 + x^2$, $du = 2x\,dx$, giving $\frac12\int\frac{du}{u} = \frac12\log(1 + x^2)$. (The stray factor of 2 is harmless.)
5. **Three to try mentally** (Spivak's): $\int\sec^2x\tan^5x\,dx = \frac{\tan^6x}{6}$; $\int\cos x\,e^{\sin x}dx = e^{\sin x}$; $\int\frac{e^x}{\sqrt{1 - e^{2x}}}dx = \arcsin e^x$ (let $u = e^x$).
6. **Linear substitutions** you should just see: $\int e^{3x}dx = \frac{e^{3x}}{3}$, $\int\cos4x\,dx = \frac{\sin4x}{4}$, $\int\frac{dx}{1 + 4x^2} = \frac{\arctan2x}{2}$. Spivak's check for where the constant goes: differentiate your guess and fix the factor.
7. **Definite, with limits changed**: $\int_0^2x(x^2 + 1)^3dx$ with $u = x^2 + 1$ running from $1$ to $5$:
$$\frac12\int_1^5u^3\,du = \frac12\cdot\frac{625 - 1}{4} = 78.$$
No back-substitution needed if the limits are changed.

### 4. When $g'(x)$ Isn't Visible: Solve for $x$

Spivak's preferred trick: write **$x$ in terms of $u$** and $dx$ in terms of $du$. If $u = g(x)$ with $g$ one-one, then $x = g^{-1}(u)$ and $dx = (g^{-1})'(u)\,du$.

- $\int\frac{1 + e^x}{1 - e^x}dx$: $u = e^x$, $x = \log u$, $dx = \frac{du}{u}$, giving $\int\frac{1 + u}{1 - u}\cdot\frac1u\,du = \int\left(\frac{2}{1 - u} + \frac1u\right)du = -2\log|1 - u| + \log u$. So the answer is $x - 2\log|1 - e^x|$.
- **Trig substitution**: $\int\sqrt{1 - x^2}\,dx$ with $x = \sin u$, $dx = \cos u\,du$ gives $\int\cos^2u\,du$. (Finishing needs $\cos^2 u = \frac{1 + \cos2u}{2}$, which is a Calc II topic, Spivak Ch. 19.)

### 5. Symmetry and Scaling

1. **Area of a circle** (Problem 19-24): with $x = rt$,
$$2\int_{-r}^r\sqrt{r^2 - x^2}\,dx = 2r^2\int_{-1}^1\sqrt{1 - t^2}\,dt = r^2\cdot\pi,$$
since Spivak **defines** $\pi$ as $2\int_{-1}^1\sqrt{1 - t^2}\,dt$ (Lecture 17). So the area is $\pi r^2$.
2. **Odd functions**: if $f(-x) = -f(x)$, then $\int_{-a}^af = 0$ (substitute $x = -u$ in $\int_{-a}^0$).
3. **Reflection** (Problem 19-23): $\int_a^bf(x)\,dx = \int_a^bf(a + b - x)\,dx$ (substitute $u = a + b - x$). E.g. $\int_0^{\pi/2}\sin^n x\,dx = \int_0^{\pi/2}\cos^n x\,dx$.

### 6. Problems to Try

- **Ch. 19**: 2 (simple substitutions, "mostly in your head"), 5 (harder substitutions; Spivak's rule of thumb is to substitute for whatever appears most prominently), 23, 24.

### Conclusion

Substitution is the chain rule run backwards, with a one-line proof from the FTC. In practice: find an inner function whose derivative is (up to a constant) also present, set $u = g(x)$ and $du = g'(x)\,dx$, and either change the limits or substitute back. When the derivative isn't visible, solving for $x$ in terms of $u$ often works. Symmetry substitutions give area formulas such as $\pi r^2$.

## Related

- [[Calc I, Lecture 37: The Fundamental Theorem of Calculus]]
- [[Calc I, Lecture 16: The Chain Rule]]
- [[Calc I, Lecture 39: The Logarithm as an Integral]]
