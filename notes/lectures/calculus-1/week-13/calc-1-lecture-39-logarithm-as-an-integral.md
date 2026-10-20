---
id: L-0043
title: "Calc I, Lecture 39: The Logarithm as an Integral"
course: Calculus I
lecture: 39
week: 13
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 18 (definition of log, Theorem 1), Ch. 13 (Problem 15), Ch. 11 (Problem 40) and Ch. 22 (Problem 12)"
summary: Paying back the debt from Week 7 with the FTC in hand, the definition of log as the integral of 1/t is fully justified; two proofs that log turns products into sums, estimates with upper and lower sums, divergence of the harmonic series, and a look back at the course.
---

In Lecture 21 we defined $\log x = \int_1^x\frac{dt}{t}$ **on credit**: we used the integral, the FTC and the MVT before having them. Now everything is proved, so this lecture **checks the construction** from start to finish, gives a second proof of $\log(xy) = \log x + \log y$ by **substitution**, and uses **upper and lower sums** to compare $\log n$ with the **harmonic numbers**. This is the course's clearest example of a new function being **built by integration**. Here's how it works:

### 1. The Definition Is Now Legitimate

$$\log x = \int_1^x\frac{dt}{t}, \qquad x > 0.$$

Checklist:
1. **Exists**: $1/t$ is continuous on $[1, x]$ (or $[x, 1]$), hence integrable (Theorem 13-3). For $x \le 0$ it's undefined because $1/t$ is unbounded near $0$.
2. **Differentiable with $\log'(x) = \frac1x$**: first FTC, since $1/t$ is continuous (Lecture 37).
3. **Increasing**: $\log' > 0$ (Corollary 11-3). So it's one-one and $\exp = \log^{-1}$ exists, with $\exp' = \exp$ (inverse function theorem, Lecture 19).

Before the FTC we had **no** function whose derivative was $1/x$: the power rule gives every $x^n$ **except** $n = -1$. The integral manufactures one.

### 2. Two Proofs That $\log(xy) = \log x + \log y$

**Proof 1 (derivatives, Spivak Theorem 18-1):** for fixed $y$, $\frac{d}{dx}\log(xy) = \frac{y}{xy} = \frac1x = \log'(x)$, so $\log(xy) = \log x + c$, and $x = 1$ gives $c = \log y$.

**Proof 2 (substitution, Problem 13-15):**
$$\log(xy) = \int_1^{xy}\frac{dt}{t} = \int_1^x\frac{dt}{t} + \int_x^{xy}\frac{dt}{t}.$$
In the last integral, put $t = xu$, $dt = x\,du$, with $u$ running from $1$ to $y$:
$$\int_x^{xy}\frac{dt}{t} = \int_1^y\frac{x\,du}{xu} = \int_1^y\frac{du}{u} = \log y.$$
Geometrically: stretching horizontally by $x$ and squashing vertically by $x$ preserves area under $1/t$.

**A characterization** (Problem 11-40): any $f$ with $f'(x) = \frac1x$ and $f(1) = 0$ satisfies $f(xy) = f(x) + f(y)$. So $\log$ is **the** function with that derivative and that normalization.

### 3. Estimates From Upper and Lower Sums

Since $1/t$ is **decreasing**, on $[k, k + 1]$ its max is $\frac1k$ and its min is $\frac{1}{k + 1}$. Using the partition $\{1, 2, \ldots, n\}$ of $[1, n]$:
$$\underbrace{\frac12 + \frac13 + \cdots + \frac1n}_{\text{lower sum}} < \log n < \underbrace{1 + \frac12 + \cdots + \frac{1}{n - 1}}_{\text{upper sum}}.$$

Consequences:
1. **The harmonic series diverges**: $1 + \frac12 + \cdots + \frac1{n-1} > \log n \to \infty$. Slowly, though: it takes more than $10^{43}$ terms to pass $100$.
2. **$\log$ is unbounded**: $\log 2 > \frac12$ (lower sum), so $\log 2^n = n\log 2 > \frac n2$. With $\log(1/x) = -\log x$ this gives all real values (IVT), so $\exp$ is defined on all of $\mathbb{R}$.
3. **Euler's constant** (Problem 22-12): $a_n = 1 + \frac12 + \cdots + \frac1n - \log n$ is decreasing and positive, so it converges to a number $\gamma \approx 0.5772$. Spivak notes nobody knows whether $\gamma$ is rational.
4. **$2 < e < 4$** (Lecture 21): $\int_1^2\frac{dt}{t} < 1 < \int_1^4\frac{dt}{t}$ by one upper sum and one lower sum.
5. **$\log x < x - 1$** for $x > 1$: $x - 1$ is an upper sum (one rectangle of height $1$). This was step 1 of "$e^x$ beats polynomials".

### 4. Integrals That Come Out as Logs

With $\log|x|$ (Problem 18-19) and substitution:
- $\int\frac{dx}{x} = \log|x|$, $\int\frac{dx}{x + 3} = \log|x + 3|$, $\int\tan x\,dx = -\log|\cos x|$.
- $\int\frac{f'(x)}{f(x)}dx = \log|f(x)|$, the logarithmic derivative read backwards (Problem 18-3 does the definite version).
- $\displaystyle\lim_{n\to\infty}\sum_{k=1}^n\frac{1}{n + k} = \int_0^1\frac{dx}{1 + x} = \log 2$ (Lecture 36's Riemann sum, finally evaluated).

### 5. Looking Back at the Course

The same pattern happened three times: **a function we wanted couldn't be defined by algebra, so calculus built it.**
1. $\sqrt2$ needed the least upper bound property (Lectures 1, 10–11).
2. $\sin$ and $\cos$ need area, i.e. integrals ($\pi = 2\int_{-1}^1\sqrt{1 - x^2}\,dx$, Lecture 17).
3. $\log$, $\exp$ and irrational powers need $\int_1^x\frac{dt}{t}$ (this lecture).

The logical chain behind all of it: **P13** → IVT/EVT → Rolle → **MVT** → "same derivative ⇒ differ by a constant" → **FTC**. Nearly every computational rule in the course is a consequence of that chain.

**Next (Calc II, Spivak Chs. 19–24):** techniques of integration (parts, trig substitution, partial fractions), Taylor polynomials and the error term (Lecture 24 hinted at it), sequences and series, and power series, where $e^x$, $\sin$ and $\log(1 + x)$ get rewritten as infinite polynomials.

### 6. Problems to Try

- **Ch. 11**: 40.
- **Ch. 13**: 15 ($\int_1^a + \int_1^b = \int_1^{ab}$ for $1/t$).
- **Ch. 18**: 3, 10, 16.
- **Ch. 22**: 12 (Euler's constant), 13 ($n!$ between $\frac{n^n}{e^{n-1}}$ and $\frac{(n+1)^{n+1}}{e^n}$, again by upper and lower sums of $\log$).

### Conclusion

$\log$, defined as the area under $1/t$, is now fully justified: it exists because $1/t$ is continuous, its derivative is $1/x$ by the FTC, and it turns products into sums, which follows from either the MVT or a one-line substitution. Comparing it with rectangle sums shows the harmonic series diverges like $\log n$. Its construction, built from integration because algebra couldn't define it, sums up what the course has been doing.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 21: The Exponential and Logarithm Functions]]
- [[Calc I, Lecture 37: The Fundamental Theorem of Calculus]]
- [[Calc I, Lecture 38: Integration by Substitution]]
