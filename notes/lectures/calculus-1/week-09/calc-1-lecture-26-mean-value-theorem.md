---
id: L-0030
title: "Calc I, Lecture 26: Rolle's Theorem and the Mean Value Theorem"
course: Calculus I
lecture: 26
week: 9
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 11 (Significance of the Derivative), Theorems 3, 4, 8"
summary: Rolle's theorem from the extreme value theorem, the Mean Value Theorem from Rolle by subtracting the secant line, the Cauchy version, and first applications such as counting roots and proving inequalities.
---

The **Mean Value Theorem (MVT)** says that if $f$ is continuous on $[a, b]$ and differentiable on $(a, b)$, then at some point the **instantaneous rate equals the average rate**:
$$f'(x) = \frac{f(b) - f(a)}{b - a}.$$
It's the main tool for getting information **about $f$ from $f'$**. Its proof is short: the hard work was already done by the Extreme Value Theorem. **Rolle's theorem** (the case $f(a) = f(b)$) comes first, and the MVT follows by tilting. Here's how it works:

### 1. Rolle's Theorem

> [!theorem] Spivak Theorem 11-3 (Rolle)
> If $f$ is continuous on $[a, b]$, differentiable on $(a, b)$, and $f(a) = f(b)$, then $f'(x) = 0$ for some $x \in (a, b)$.

> [!proof]
> By the EVT, $f$ has a max and a min on $[a, b]$.
> - If the max occurs at an interior point $x$, then $f'(x) = 0$ (Theorem 11-1).
> - If the min occurs at an interior point, the same.
> - Otherwise both occur at endpoints. Since $f(a) = f(b)$, max = min, so $f$ is **constant** and $f' = 0$ everywhere in $(a, b)$.

**Every hypothesis matters:** $|x|$ on $[-1, 1]$ has $f(-1) = f(1)$ but $f'$ is never $0$ (not differentiable at $0$). A function that jumps at an endpoint can fail too.

### 2. The Mean Value Theorem

> [!theorem] Spivak Theorem 11-4 (MVT)
> If $f$ is continuous on $[a, b]$ and differentiable on $(a, b)$, then for some $x \in (a, b)$,
> $$f'(x) = \frac{f(b) - f(a)}{b - a}.$$

> [!proof]
> Subtract the secant line. Let
> $$h(x) = f(x) - \frac{f(b) - f(a)}{b - a}(x - a).$$
> $h$ is continuous on $[a, b]$, differentiable on $(a, b)$, and $h(a) = f(a) = h(b)$. By Rolle, $h'(x) = 0$ for some $x$, i.e. $f'(x) = \dfrac{f(b) - f(a)}{b - a}$.

- **Geometric**: some tangent line is **parallel to the secant** from $(a, f(a))$ to $(b, f(b))$.
- **Physical** (Spivak's example): drive 60 miles in an hour and at some instant you were going **exactly** 60 mph.
- The MVT says nothing about **where** $x$ is. It's an existence theorem, but the inequalities it gives are completely concrete.

### 3. The Cauchy Mean Value Theorem

> [!theorem] Spivak Theorem 11-8
> If $f, g$ are continuous on $[a, b]$ and differentiable on $(a, b)$, there's $x \in (a, b)$ with
> $$[f(b) - f(a)]\,g'(x) = [g(b) - g(a)]\,f'(x).$$

> [!proof]
> Apply Rolle to $h(x) = f(x)[g(b) - g(a)] - g(x)[f(b) - f(a)]$, which has $h(a) = f(a)g(b) - g(a)f(b) = h(b)$.

With $g(x) = x$ this is the MVT. Applying the MVT to $f$ and $g$ separately would give **two different** points $x$ and $y$, and the point of Cauchy's version is that **one** $x$ works for both. It's the engine behind l'Hôpital's rule (Lecture 30).

### 4. Applications

1. **Counting roots with Rolle.** Between two roots of $f$ there's a root of $f'$. So if $f'$ has at most $n - 1$ roots, $f$ has at most $n$. By induction, **a polynomial of degree $n$ has at most $n$ roots** (Spivak's calculus proof of an algebra fact).
2. **$x^3 - 3x + m$ never has two roots in $[0, 1]$** (Problem 11-36): two roots would force a root of $f'(x) = 3x^2 - 3$ strictly between them, but $f' = 0$ only at $x = \pm1$, and $1$ isn't strictly inside $[0, 1]$.
3. **$x^5 + x - 1$ has exactly one real root.** At least one: odd degree (IVT). At most one: $f'(x) = 5x^4 + 1 > 0$, so two roots would give a zero of $f'$ by Rolle.
4. **Bounding change by bounding the derivative** (Problem 11-25): if $|f'| \le M$ on $[a, b]$, then $|f(b) - f(a)| \le M(b - a)$.
   - $|\sin x - \sin y| \le |x - y|$, since $|\cos| \le 1$ (Problem 15-25 asks for strict $<$ when $x \ne y$).
   - **$\sqrt{66}$ again**: $\sqrt{66} - 8 = \frac{1}{2\sqrt\xi}\cdot 2 = \frac{1}{\sqrt\xi}$ for some $\xi \in (64, 66)$, so $\frac{1}{\sqrt{66}} < \sqrt{66} - 8 < \frac18$, and $\frac1{\sqrt{66}} > \frac19$. That's Problem 11-44 done properly.
5. **A root of a polynomial from its coefficients** (Problem 11-35): if $a_0 + \frac{a_1}{2} + \cdots + \frac{a_n}{n+1} = 0$, then $a_0 + a_1x + \cdots + a_nx^n$ has a root in $[0, 1]$. Apply Rolle to $F(x) = a_0x + \frac{a_1}2x^2 + \cdots + \frac{a_n}{n+1}x^{n+1}$, which satisfies $F(0) = F(1) = 0$.

### 5. Problems to Try

- **Ch. 11**: 25, 35, 36, 37 (exactly one fixed point if $f' \ne 1$), 38 ($x^2 = \cos x$ has exactly two solutions), 42 ($n + 1$ zeros ⇒ $f^{(n)}$ has a zero), 44, 45, 46, 47.

### Conclusion

Rolle comes from the EVT plus Fermat. The MVT is Rolle applied to $f$ minus its secant line, and Cauchy's version is Rolle applied to a clever combination of two functions. The MVT is how information about $f'$ gets turned into information about $f$, and the next lecture shows how far that goes.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 25: Maxima, Minima and Critical Points]]
- [[Calc I, Lecture 27: Monotonicity and the First Derivative Test]]
- [[Calc I, Lecture 30: L'Hopital's Rule]]
- [[Calc I, Lecture 37: The Fundamental Theorem of Calculus]]
