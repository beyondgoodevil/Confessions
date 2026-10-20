---
id: L-0039
title: "Calc I, Lecture 35: The Definite Integral"
course: Calculus I
lecture: 35
week: 12
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 13 (Integrals), definitions, Lemma, Theorems 1 and 2"
summary: Partitions, lower and upper sums defined with inf and sup, why refining a partition helps, why every lower sum is below every upper sum, the definition of integrability, and the epsilon criterion with examples.
---

The **integral** $\int_a^b f$ is defined as the unique number lying between **every lower sum** and **every upper sum** of $f$, when there is exactly one such number. Functions where that happens are **integrable**. The key facts are that **refining a partition** raises lower sums and lowers upper sums, so every lower sum is $\le$ every upper sum; and the working test is that $f$ is integrable iff **$U - L$ can be made smaller than any ε**. Here's how it works:

### 1. Partitions and Lower/Upper Sums

> [!definition] Partition (Spivak Ch. 13)
> A **partition** of $[a, b]$ is a finite set of points in $[a, b]$ containing $a$ and $b$, numbered $a = t_0 < t_1 < \cdots < t_n = b$.

> [!definition] Lower and upper sums
> For $f$ **bounded** on $[a, b]$ and $P = \{t_0, \ldots, t_n\}$, let
> $$m_i = \inf\{f(x) : t_{i-1} \le x \le t_i\}, \qquad M_i = \sup\{f(x) : t_{i-1} \le x \le t_i\}.$$
> $$L(f, P) = \sum_{i=1}^n m_i(t_i - t_{i-1}), \qquad U(f, P) = \sum_{i=1}^n M_i(t_i - t_{i-1}).$$

- **inf/sup, not min/max**, because $f$ isn't assumed continuous, so the extremes needn't be attained. This is where P13 (Lecture 11) comes in.
- **Bounded** is required so that the $m_i$, $M_i$ exist.
- Obviously $L(f, P) \le U(f, P)$ for the **same** $P$. The definitions mention no "area"; they're purely numbers.

### 2. Refining Helps

> [!theorem] Spivak's Lemma, Ch. 13
> If $Q \supseteq P$ (a **refinement**), then $L(f, P) \le L(f, Q)$ and $U(f, Q) \le U(f, P)$.

> [!proof]
> Add one point $u$ to $P$, inside $[t_{k-1}, t_k]$, with $m' = \inf f$ on $[t_{k-1}, u]$ and $m'' = \inf f$ on $[u, t_k]$. A sup/inf over a **bigger** set is more extreme, so $m_k \le m'$ and $m_k \le m''$. Then
> $$m_k(t_k - t_{k-1}) = m_k(u - t_{k-1}) + m_k(t_k - u) \le m'(u - t_{k-1}) + m''(t_k - u).$$
> All other terms are unchanged, so $L$ goes up (or stays). Upper sums: symmetric. For general $Q$, add points one at a time.

> [!theorem] Spivak Theorem 13-1
> For **any** partitions $P_1$, $P_2$ of $[a, b]$: $\;L(f, P_1) \le U(f, P_2)$.

> [!proof]
> Let $P = P_1 \cup P_2$, a common refinement. By the lemma, $L(f, P_1) \le L(f, P) \le U(f, P) \le U(f, P_2)$.

So every upper sum is an upper bound for the set of lower sums, and therefore
$$\sup_P L(f, P) \le \inf_P U(f, P).$$

### 3. Integrability

> [!definition] Integrable, integral
> A bounded $f$ is **integrable on $[a, b]$** if $\sup\{L(f, P)\} = \inf\{U(f, P)\}$. The common value is the **integral**, written $\displaystyle\int_a^b f$ or $\displaystyle\int_a^b f(x)\,dx$.

- Equivalently, $\int_a^b f$ is the **unique** number with $L(f, P) \le \int_a^b f \le U(f, P)$ for all $P$.
- For $f \ge 0$ it's **defined** to be the area of $R(f, a, b)$. If $f$ takes negative values it's a **signed** area: the part below the axis counts negatively.
- **Notation**: $x$ in $\int_a^b f(x)\,dx$ is a dummy variable, like in $\lim_{x\to a}$; $dx$ means nothing on its own. (Leibniz's picture was a sum of infinitely many rectangles of height $f(x)$ and infinitesimal width $dx$, which is where the elongated S comes from.)

### 4. Examples

1. **Constant** $f = c$: every $m_i = M_i = c$, so every $L = U = c(b - a)$. $\int_a^b c = c(b - a)$, the area of a rectangle. ✓
2. **Not integrable**: $f = 1$ on $\mathbb{Q}$, $0$ off it. Every subinterval contains both kinds of numbers, so every $m_i = 0$ and every $M_i = 1$: $L = 0$ and $U = b - a$ for **all** $P$. The sup and inf don't match. Spivak's point: a region this unreasonable doesn't deserve an area.

### 5. The ε Criterion

> [!theorem] Spivak Theorem 13-2
> A bounded $f$ is integrable on $[a, b]$ iff for every $\varepsilon > 0$ there is a partition $P$ with $U(f, P) - L(f, P) < \varepsilon$.

> [!proof]
> (⇐) $\inf U - \sup L \le U(f, P) - L(f, P) < \varepsilon$ for every ε, so it's $0$.
> (⇒) If $\inf U = \sup L$, there are $P'$, $P''$ with $U(f, P') - L(f, P'') < \varepsilon$. Take $P = P' \cup P''$. Refinement only helps, so $U(f, P) - L(f, P) \le U(f, P') - L(f, P'') < \varepsilon$.

It's a restatement of the definition with no sups or infs in it, which makes it the practical test.

**Example (one bad point):** on $[0, 2]$ let $f(x) = 0$ except $f(1) = 1$. If $t_{j-1} < 1 < t_j$, only the $j$th piece has $M_j = 1$ (and $m_j = 0$), so $U - L = t_j - t_{j-1}$, which can be made $< \varepsilon$. **Integrable**, and since $L(f, P) = 0$ always, **$\int_0^2 f = 0$**. Changing a function at one point doesn't change its integral.

**Example ($f(x) = x$ on $[0, b]$):** last lecture's computation gives $U(f, P_n) - L(f, P_n) = \frac{b^2}{n} < \varepsilon$ for large $n$. So $f$ is integrable, and since $\frac{b^2}{2}$ lies between all $L(f, P_n)$ and $U(f, P_n)$, $\int_0^b x\,dx = \frac{b^2}{2}$. Similarly $\int_a^b x\,dx = \frac{b^2 - a^2}{2}$ and $\int_a^b x^2\,dx = \frac{b^3 - a^3}{3}$.

### 6. Problems to Try

- **Ch. 13**: 1, 7 (which functions are integrable on $[0, 2]$?), 11 (when is every lower sum equal to every upper sum?), 19 (one discontinuity is fine), 20 (monotone functions are integrable), 33 ($x$ on $\mathbb{Q}$, $0$ off), 34 (Thomae's function **is** integrable, with integral $0$).

### Conclusion

Lower and upper sums use inf and sup on each piece. Refinement pushes them together, so every lower sum sits below every upper sum. A function is integrable when the two meet, and that meeting value is the integral. In practice, integrability means finding partitions with $U - L < \varepsilon$. Constants, one-jump functions and $x$ all pass, and the rationals indicator fails badly.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 34: Areas and Sigma Notation]]
- [[Calc I, Lecture 36: Properties of the Integral and Riemann Sums]]
- [[Calc I, Lecture 11: Extreme Values and Least Upper Bounds]]
