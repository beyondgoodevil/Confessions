---
id: L-0010
title: "Calc I, Lecture 06: The Limit Laws"
course: Calculus I
lecture: 6
week: 2
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 5 (Limits), Lemma and Theorem 2"
summary: Proofs that limits respect sums, products and reciprocals, the epsilon-bookkeeping lemma behind them, and how to use the laws to evaluate limits of rational functions.
---

The **limit laws** say that if $\lim f = l$ and $\lim g = m$ at $a$, then $\lim (f + g) = l + m$, $\lim (fg) = lm$, and $\lim (1/g) = 1/m$ when $m \ne 0$. With these, plus $\lim c = c$ and $\lim x = a$, we can evaluate limits of every **rational function** without ever finding a δ by hand. The proofs all rest on one **lemma** about approximate arithmetic. Here's how it works:

### 1. The Lemma (Approximate Arithmetic)

The idea: if $x$ is close to $x_0$ and $y$ is close to $y_0$, then $x + y$ is close to $x_0 + y_0$, $xy$ is close to $x_0 y_0$, and $1/y$ is close to $1/y_0$. The lemma just says **how close** is close enough.

> [!theorem] Lemma (Spivak Ch. 5; also Problems 1-20 to 1-22)
> 1. If $|x - x_0| < \tfrac{\varepsilon}{2}$ and $|y - y_0| < \tfrac{\varepsilon}{2}$, then $|(x + y) - (x_0 + y_0)| < \varepsilon$.
> 2. If $|x - x_0| < \min\left(1, \dfrac{\varepsilon}{2(|y_0| + 1)}\right)$ and $|y - y_0| < \dfrac{\varepsilon}{2(|x_0| + 1)}$, then $|xy - x_0 y_0| < \varepsilon$.
> 3. If $y_0 \ne 0$ and $|y - y_0| < \min\left(\dfrac{|y_0|}{2}, \dfrac{\varepsilon |y_0|^2}{2}\right)$, then $y \ne 0$ and $\left|\dfrac1y - \dfrac1{y_0}\right| < \varepsilon$.

> [!proof]
> (1) Triangle inequality.
> (2) From $|x - x_0| < 1$, $|x| < 1 + |x_0|$. Then the **add-and-subtract trick**:
> $$|xy - x_0y_0| = |x(y - y_0) + y_0(x - x_0)| \le |x|\,|y - y_0| + |y_0|\,|x - x_0| < (1+|x_0|)\tfrac{\varepsilon}{2(|x_0|+1)} + |y_0|\tfrac{\varepsilon}{2(|y_0|+1)} < \tfrac\varepsilon2 + \tfrac\varepsilon2.$$
> (3) $|y_0| - |y| \le |y - y_0| < |y_0|/2$ gives $|y| > |y_0|/2$, so $y \ne 0$ and
> $$\left|\frac1y - \frac1{y_0}\right| = \frac{|y_0 - y|}{|y|\,|y_0|} < \frac{2}{|y_0|^2}\cdot\frac{\varepsilon|y_0|^2}{2} = \varepsilon.$$

My note: Spivak suggests reading Theorem 2 first to see *why* the lemma is shaped like this. The lemma is pure bookkeeping, and the theorem is where it gets used.

### 2. The Limit Laws

> [!theorem] Spivak Theorem 5-2
> If $\lim_{x\to a} f(x) = l$ and $\lim_{x\to a} g(x) = m$, then
> 1. $\lim_{x\to a} (f + g)(x) = l + m$;
> 2. $\lim_{x\to a} (f \cdot g)(x) = l \cdot m$;
> 3. if $m \ne 0$, $\lim_{x\to a} \left(\dfrac1g\right)(x) = \dfrac1m$.

> [!proof] Proof of (1)
> Given $\varepsilon > 0$, since $\varepsilon/2 > 0$ too there are $\delta_1, \delta_2 > 0$ with $|f(x) - l| < \varepsilon/2$ for $0 < |x - a| < \delta_1$ and $|g(x) - m| < \varepsilon/2$ for $0 < |x - a| < \delta_2$. Let $\delta = \min(\delta_1, \delta_2)$. Then for $0 < |x - a| < \delta$ both hold, and part (1) of the lemma gives $|(f+g)(x) - (l + m)| < \varepsilon$.
> (2) and (3) are identical in shape: choose $\delta_1, \delta_2$ so that $f(x), g(x)$ satisfy the hypotheses of lemma parts (2) and (3), then take the min. Part (3) also shows $g(x) \ne 0$ near $a$, so $1/g$ is even defined there.

**Consequences:**

- $\lim (cf) = c \lim f$ (product with a constant function); $\lim (f - g) = l - m$.
- $\lim (f/g) = l/m$ if $m \ne 0$, since $f/g = f \cdot (1/g)$.
- By induction, $\lim x^n = a^n$, and every **polynomial** satisfies $\lim_{x\to a} p(x) = p(a)$.
- Every **rational function** $p/q$ satisfies $\lim_{x\to a} \frac{p(x)}{q(x)} = \frac{p(a)}{q(a)}$ when $q(a) \ne 0$.

### 3. The Proof Is Also a Recipe for δ

If you actually want δ for $x^2 + x$ at $a$: the proof of (1) says use $\delta = \min(\delta_1, \delta_2)$ where $\delta_1$ works for $x^2$ with tolerance $\varepsilon/2$ and $\delta_2$ works for $x$ with tolerance $\varepsilon/2$. From Lecture 5:
$$\delta = \min\left(\min\left(1, \frac{\varepsilon/2}{2|a|+1}\right), \frac\varepsilon2\right).$$
Ugly, but completely mechanical. **We never have to do this again**: the theorem does it for us.

### 4. Worked Examples

1. $\displaystyle\lim_{x\to a} \frac{x^3 + 7x^5}{x^2 + 1} = \frac{a^3 + 7a^5}{a^2 + 1}$: denominator never $0$, so the laws apply directly.
2. $\displaystyle\lim_{x\to 1} \frac{x^2 - 1}{x - 1}$: the laws **don't** apply directly (denominator $\to 0$). But for $x \ne 1$ the function equals $x + 1$, and **a limit only depends on values near $a$, not at $a$** (Problem 5-11), so the limit is $2$.
3. $\displaystyle\lim_{x\to 0} \frac{\sqrt{1 + x} - 1}{x}$: rationalize: $\dfrac{(1+x) - 1}{x(\sqrt{1+x} + 1)} = \dfrac{1}{\sqrt{1+x} + 1}$ for $x \ne 0$, so the limit is $\tfrac12$ (this uses $\lim \sqrt{1+x} = 1$, which follows from continuity of $\sqrt{\ }$ in Lecture 9).
4. $\displaystyle\lim_{h\to0}\frac{1/(a+h) - 1/a}{h}$ for $a \ne 0$: $= \lim_{h\to0} \dfrac{-1}{a(a+h)} = -\dfrac{1}{a^2}$. This is $f'(a)$ for $f(x) = 1/x$ (Problem 9-1).

> [!note] Things that look like limit laws but aren't
> If $\lim f$ and $\lim g$ **don't exist**, $\lim(f + g)$ or $\lim fg$ still might (Problem 5-8): take $f = $ sign function and $g = -f$. The laws only go one direction: from the limits of the pieces to the limit of the combination.

### 5. Problems to Try

- **Ch. 5**: 1 (say which law each step uses), 8 (limits of sums/products when the pieces have no limit), 10 ($\lim f = l$ iff $\lim(f - l) = 0$), 11 (limits only depend on nearby values), 12 (limits preserve $\le$), 18 (functions with limits are locally bounded).

### Conclusion

One lemma about approximate arithmetic plus the "$\varepsilon/2$ and take the min" trick proves the limit laws. After that, limits of polynomials and of rational functions with nonzero denominators are just evaluation, and the genuinely interesting limits are the $0/0$ ones, where algebra (or later, derivatives) has to do the work.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 05: The Epsilon-Delta Definition of a Limit]]
- [[Calc I, Lecture 07: One-Sided Limits and Limits at Infinity]]
- [[Calc I, Lecture 09: Continuity]]
