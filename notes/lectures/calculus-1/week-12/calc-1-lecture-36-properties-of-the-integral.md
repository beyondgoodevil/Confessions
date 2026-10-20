---
id: L-0039
title: "Calc I, Lecture 36: Properties of the Integral and Riemann Sums"
course: Calculus I
lecture: 36
week: 12
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 13 (Theorems 3-8, Problems 13, 20, 29), Ch. 8 Appendix (uniform continuity) and Ch. 13 Appendix (Riemann sums)"
summary: Continuous and monotone functions are integrable, additivity over intervals, linearity, the bounds m(b-a) and M(b-a), the mean value theorem for integrals, continuity of the area function, and Riemann sums.
---

Checking integrability from scratch every time is painful, so this lecture collects the **structural facts**: **continuous functions are integrable**, the integral is **additive over intervals** and **linear**, it's **bounded** by $m(b - a)$ and $M(b - a)$, and the area function $F(x) = \int_a^x f$ is **always continuous**. **Riemann sums** let us sample $f$ at **any** point of each piece and still converge to the integral. Here's how it works:

### 1. Which Functions Are Integrable

> [!theorem] Spivak Theorem 13-3
> If $f$ is continuous on $[a, b]$, then $f$ is integrable on $[a, b]$.

> [!proof] Sketch
> A continuous $f$ on $[a, b]$ is **uniformly continuous** (Ch. 8 Appendix): for every $\varepsilon$ there's **one** $\delta$ that works at **every** point, with $|x - y| < \delta \Rightarrow |f(x) - f(y)| < \frac{\varepsilon}{2(b - a)}$. Take a partition with all pieces shorter than $\delta$. Then on each piece $M_i - m_i \le \frac{\varepsilon}{2(b-a)} < \frac{\varepsilon}{b - a}$, so
> $$U - L = \sum(M_i - m_i)(t_i - t_{i-1}) < \frac{\varepsilon}{b - a}\sum(t_i - t_{i-1}) = \varepsilon.$$

(Spivak also gives an "elementary" proof at the end of Ch. 14 via lower and upper **integrals**, reusing the FTC argument.)

**Also integrable:** **monotone** functions (Problem 13-20: for equal pieces, $U - L = \frac{b - a}{n}[f(b) - f(a)]$, which telescopes!), and bounded functions with finitely many discontinuities (Problem 13-19). Even Thomae's function is integrable (Problem 13-34).

### 2. Algebra of Integrals

> [!theorem] Spivak Theorem 13-4 (Additivity)
> If $a < c < b$, then $f$ is integrable on $[a, b]$ iff it's integrable on $[a, c]$ and on $[c, b]$, and then $\displaystyle\int_a^b f = \int_a^c f + \int_c^b f$.

**Conventions** that make additivity hold for **any** order of $a, b, c$:
$$\int_a^a f = 0, \qquad \int_b^a f = -\int_a^b f.$$

> [!theorem] Spivak Theorems 13-5, 13-6 (Linearity)
> If $f, g$ are integrable on $[a, b]$, so are $f + g$ and $cf$, with $\int(f + g) = \int f + \int g$ and $\int cf = c\int f$.

The sum proof needs $\inf(f + g) \ge \inf f + \inf g$ on each piece (Problem 13-10), since the infima can occur at different points. (That $fg$ is integrable is true but much harder: Problem 13-38.)

### 3. Inequalities

> [!theorem] Spivak Theorem 13-7
> If $m \le f(x) \le M$ on $[a, b]$, then $m(b - a) \le \int_a^b f \le M(b - a)$.

Proof: $m(b - a) \le L(f, P)$ and $U(f, P) \le M(b - a)$ for every $P$.

Consequences:
- **Monotonicity** (Problem 13-13): $f \ge 0 \Rightarrow \int_a^b f \ge 0$; so $f \le g \Rightarrow \int f \le \int g$.
- **Triangle inequality** (Problem 13-37): $\left|\int_a^b f\right| \le \int_a^b|f|$.

> [!theorem] Mean value theorem for integrals
> If $f$ is continuous on $[a, b]$, then $\int_a^b f = f(\xi)(b - a)$ for some $\xi \in [a, b]$.

> [!proof]
> With $m$, $M$ the min and max of $f$ (EVT), Theorem 13-7 says the average $\frac{1}{b - a}\int_a^b f$ is between $m$ and $M$, so by the IVT $f$ takes that value somewhere.

So $\frac{1}{b-a}\int_a^b f$ really is the **average value** of $f$.

### 4. The Area Function Is Continuous

> [!theorem] Spivak Theorem 13-8
> If $f$ is integrable on $[a, b]$ and $F(x) = \int_a^x f$, then $F$ is continuous on $[a, b]$.

> [!proof]
> $f$ is bounded, say $|f| \le M$. For $h > 0$: $F(c + h) - F(c) = \int_c^{c+h} f$, which is between $-Mh$ and $Mh$ by 13-7. Similarly for $h < 0$. So $|F(c + h) - F(c)| \le M|h|$, which $\to 0$.

Even if $f$ is badly discontinuous, its area function is continuous: **integration smooths**. Next lecture: if $f$ is continuous, $F$ is even **differentiable**.

### 5. Riemann Sums

> [!definition] Riemann sum (Ch. 13 Appendix)
> For a partition $P$ and **any** choice of $x_i \in [t_{i-1}, t_i]$, the number $\sum_{i=1}^n f(x_i)(t_i - t_{i-1})$ is a **Riemann sum** for $f$. Clearly $L(f, P) \le \text{(Riemann sum)} \le U(f, P)$.

> [!theorem] Ch. 13 Appendix, Theorem 1
> If $f$ is integrable on $[a, b]$, then for every $\varepsilon > 0$ there's $\delta > 0$ such that **every** Riemann sum for **every** partition with all pieces shorter than $\delta$ is within $\varepsilon$ of $\int_a^b f$.

So left endpoints, right endpoints, midpoints all converge to the integral (and this is how most textbooks **define** it). Spivak's moral: anything that looks like a good approximation to the integral really is one, as long as the pieces are thin.

### 6. Worked Examples

1. $\displaystyle\lim_{n\to\infty}\sum_{k=1}^n\frac{k}{n^2} = \lim\sum_{k=1}^n\frac kn\cdot\frac1n = \int_0^1x\,dx = \frac12$ (right-endpoint Riemann sums for $x$).
2. $\displaystyle\lim_{n\to\infty}\sum_{k=1}^n\frac{1}{n + k} = \lim\sum_{k=1}^n\frac{1}{1 + k/n}\cdot\frac1n = \int_0^1\frac{dx}{1 + x} = \log 2 \approx 0.693$ (once the FTC gives that integral).
3. **Estimate without computing**: on $[0, 1]$, $\frac12 \le \frac{1}{1 + x^2} \le 1$, so $\frac12 \le \int_0^1\frac{dx}{1 + x^2} \le 1$. (Exact value: $\frac\pi4 \approx 0.785$.)
4. **Odd functions**: $\int_{-a}^a x^3\,dx = 0$. The signed areas cancel, but the actual area is $2\int_0^a x^3 = \frac{a^4}{2}$.

### 7. Problems to Try

- **Ch. 13**: 5 (evaluate without computing), 8 (areas between graphs), 12, 13, 14, 16 ($\int_a^b f(t)\,dt$ under scaling), 19, 20, 29, 37.
- **Ch. 13 Appendix**: Theorem 1 (read the proof).

### Conclusion

Continuous functions are integrable because they're uniformly continuous on closed intervals. The integral is additive over intervals, linear, monotone, and sandwiched by $m(b - a)$ and $M(b - a)$, which gives the mean value theorem for integrals. The area function is always continuous, and Riemann sums with arbitrary sample points converge to the integral. We still can't compute integrals easily, though; that's what the FTC is for.

## Related

- [[Calc I, Lecture 35: The Definite Integral]]
- [[Calc I, Lecture 37: The Fundamental Theorem of Calculus]]
- [[Calc I, Lecture 10: The Intermediate Value Theorem]]
