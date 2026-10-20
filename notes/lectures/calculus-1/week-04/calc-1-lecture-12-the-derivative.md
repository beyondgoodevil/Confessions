---
id: L-0015
title: "Calc I, Lecture 12: The Derivative"
course: Calculus I
lecture: 12
week: 4
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 9 (Derivatives)"
summary: Definition of the derivative as the limit of difference quotients, the tangent line, velocity as a derivative, Leibniz notation, and derivatives of constants, lines, x squared, x cubed, 1/x and the square root from the definition.
---

The **derivative** of $f$ at $a$ is
$$f'(a) = \lim_{h\to0}\frac{f(a+h) - f(a)}{h},$$
when this limit exists. It is the **slope of the tangent line** and the **instantaneous rate of change**, and Lectures 4–11 were all preparation for it. Today: the definition, the tangent line, notation, and computing derivatives straight from the definition. Here's how it works:

### 1. The Definition

> [!definition] Derivative (Spivak Ch. 9)
> $f$ is **differentiable at $a$** if $\displaystyle\lim_{h\to0}\frac{f(a+h) - f(a)}{h}$ exists. The limit is written $f'(a)$, the **derivative of $f$ at $a$**. $f$ is **differentiable** if it's differentiable at every point of its domain.

> [!definition] Tangent line
> The **tangent line** to the graph of $f$ at $(a, f(a))$ is the line through that point with slope $f'(a)$:
> $$y = f'(a)(x - a) + f(a).$$
> So the tangent line is **defined** only where $f$ is differentiable.

- Equivalent form (Problem 9-21): $f'(a) = \displaystyle\lim_{x\to a}\frac{f(x) - f(a)}{x - a}$. Same thing with $x = a + h$ (Problem 5-9).
- **The derivative function** $f'$ is the function whose domain is the set of points where $f$ is differentiable and whose value there is $f'(a)$. It may have a smaller domain than $f$.

### 2. Rates of Change

If $s(t)$ is position on a line, $\frac{s(a+h) - s(a)}{h}$ is the **average velocity** over $[a, a+h]$, and the **(instantaneous) velocity** at $a$ is **defined** to be $s'(a)$. $|s'(a)|$ is the **speed**. In general $f'$ is "the rate of change of $f$": rate of change of mass, of temperature, of anything that varies.

### 3. Derivatives From the Definition

1. **Constant** $f(x) = c$: $\frac{c - c}{h} = 0$, so $f'(a) = 0$.
2. **Linear** $f(x) = cx + d$: $\frac{c(a+h) + d - (ca + d)}{h} = c$, so $f'(a) = c$. The tangent line is the graph itself.
3. **$f(x) = x^2$**: $\frac{(a+h)^2 - a^2}{h} = 2a + h \to 2a$. So $f'(a) = 2a$.
   - The tangent at $(a, a^2)$ is $y = 2a(x - a) + a^2 = 2ax - a^2$. It meets the parabola where $x^2 = 2ax - a^2$, i.e. $(x - a)^2 = 0$, **only at $x = a$**.
4. **$f(x) = x^3$**: $\frac{(a+h)^3 - a^3}{h} = 3a^2 + 3ah + h^2 \to 3a^2$.
   - Tangent: $y = 3a^2 x - 2a^3$. Intersections: $x^3 - 3a^2x + 2a^3 = (x - a)^2(x + 2a) = 0$, so the tangent **also hits the curve at $(-2a, -8a^3)$**. This shows "tangent = touches once" really is the wrong definition.
5. **$f(x) = 1/x$** (Problem 9-1), $a \ne 0$:
$$\frac{\frac{1}{a+h} - \frac1a}{h} = \frac{a - (a+h)}{h\,a(a+h)} = \frac{-1}{a(a+h)} \to -\frac{1}{a^2}.$$
6. **$f(x) = \sqrt x$** (Problem 9-3), $a > 0$. Rationalize:
$$\frac{\sqrt{a+h} - \sqrt a}{h} = \frac{(a + h) - a}{h(\sqrt{a+h} + \sqrt a)} = \frac{1}{\sqrt{a+h} + \sqrt a} \to \frac{1}{2\sqrt a}.$$

Pattern so far: $(x^n)' = nx^{n-1}$ for $n = 1, 2, 3, -1, \tfrac12$. Problem 9-4 asks you to conjecture and prove it for all $n \in \mathbb{N}$ (we do it with induction in Lecture 14).

### 4. Leibniz Notation

$f'(x)$ is also written $\dfrac{df(x)}{dx}$, or $\dfrac{df}{dx}$, or (with "the function $y = x^2$") $\dfrac{dy}{dx}$. So the results above read
$$\frac{dc}{dx} = 0,\quad \frac{d(ax + b)}{dx} = a,\quad \frac{dx^2}{dx} = 2x,\quad \frac{dx^3}{dx} = 3x^2.$$

- The $d$'s **are not numbers** and can't be cancelled. Leibniz meant an "infinitely small" $dx$; that idea doesn't fit P1–P13, but the notation survived because it's convenient.
- $f'(a)$ in Leibniz notation is the clunky $\left.\dfrac{df(x)}{dx}\right|_{x=a}$.
- Spivak bans Leibniz notation from his text but uses it in problems. We'll use both, especially for related rates (Lecture 23) and substitution (Lecture 38), where Leibniz notation does real work.

### 5. Worked Examples

1. **Tangent to $y = x^2$ at $x = 3$**: slope $6$, line $y = 6(x - 3) + 9 = 6x - 9$.
2. **Tangent to $y = 1/x$ at $(2, \tfrac12)$**: slope $-\tfrac14$, line $y = -\tfrac14(x - 2) + \tfrac12 = 1 - \tfrac x4$. It meets the axes at $(4, 0)$ and $(0, 1)$, which form a triangle of area $2$. (In fact the area is $2$ for **every** tangent to $1/x$. Check it!)
3. **Ball thrown up**: $s(t) = -16t^2 + 64t$. $s'(t) = \lim_{h\to0}\frac{-16(2th + h^2) + 64h}{h} = -32t + 64$. Velocity $0$ at $t = 2$, the top of the flight.
4. **$g(x) = f(x + c)$** (Problem 9-8): $g'(x) = \lim_{h\to0}\frac{f(x + c + h) - f(x + c)}{h} = f'(x + c)$. Shifting the graph shifts the derivative.

### 6. Problems to Try

- **Ch. 9**: 1, 2, 3 (derivatives from the definition), 4 (conjecture $S_n'$), 7 ($f'(9)$ vs $f'(3^2)$: careful reading of notation), 8, 21 (the $x \to a$ form), 30 (interpret Leibniz notation).

### Conclusion

The derivative is the limit of secant slopes. It **defines** the tangent line and instantaneous velocity rather than the other way around, and computing it straight from the definition is just algebra followed by a limit, usually after cancelling an $h$ (factoring or rationalizing). Next lecture is about where that limit fails to exist.

## Related

- [[Calc I, Lecture 04: Tangents, Velocity and the Idea of a Limit]]
- [[Calc I, Lecture 13: Differentiability and Higher Derivatives]]
- [[Calc I, Lecture 24: Linear Approximation and Differentials]]
