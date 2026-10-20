---
id: L-0037
title: "Calc I, Lecture 34: Areas and Sigma Notation"
course: Calculus I
lecture: 34
week: 12
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 2 (sigma notation, induction, Problems 1, 5, 6) and Ch. 13 (Integrals, opening section)"
summary: The area problem, sigma notation and its rules, closed forms for sums of powers, and squeezing the area under y = x and y = x squared between rectangle sums.
---

The second big idea of calculus is **area**: the area of the region under the graph of $f \ge 0$ between $a$ and $b$. We can't define it directly, but we can **trap** it between the total areas of rectangles **inside** the region and rectangles **containing** it, and then make the rectangles thin. To compute those totals we need **sigma notation** and formulas like $\sum i^2 = \frac{n(n+1)(2n+1)}{6}$. Today: the setup and two areas done by hand. Next lecture makes it a definition. Here's how it works:

### 1. The Area Problem

Spivak's region $R(f, a, b)$: bounded by the $x$-axis, the vertical lines $x = a$ and $x = b$, and the graph of $f \ge 0$. Elementary geometry never really **defines** area beyond polygons ("count the unit squares that fit" doesn't work for a circle of radius $1$: how do $\pi$ squares fit?). So:

- Chop $[a, b]$ into pieces $a = t_0 < t_1 < \cdots < t_n = b$.
- On each piece, a rectangle with height = the **smallest** value of $f$ lies inside $R$, and one with height = the **largest** value contains that slice of $R$.
- Whatever the area $A$ is, it must satisfy **(sum of inner rectangles) $\le A \le$ (sum of outer rectangles)** for **every** way of chopping. The hope is that this pins $A$ down.

**Same idea, different story (distance):** if a car's velocity $v(t)$ is known, the distance travelled over $[a, b]$ is trapped between $\sum(\min v)\Delta t$ and $\sum(\max v)\Delta t$. So distance is the "area under the velocity graph". This is the first hint of the FTC: the area under $s'$ is the change in $s$.

### 2. Sigma Notation

> [!definition] Sigma notation (Spivak Ch. 2)
> $\displaystyle\sum_{i=1}^n a_i$ means $a_1 + a_2 + \cdots + a_n$. Precisely (recursively): $\sum_{i=1}^1 a_i = a_1$ and $\sum_{i=1}^n a_i = \sum_{i=1}^{n-1}a_i + a_n$.

- The index is a **dummy**: $\sum_{i=1}^n i = \sum_{j=1}^n j$.
- **Linearity**: $\sum(ca_i + b_i) = c\sum a_i + \sum b_i$.
- **Telescoping**: $\sum_{i=1}^n (a_i - a_{i-1}) = a_n - a_0$. This is the most useful trick, and secretly a discrete FTC.
- **Constants**: $\sum_{i=1}^n c = nc$.

### 3. Sums of Powers

> [!theorem] Problem 2-1 and the text of Ch. 2
> $$\sum_{i=1}^n i = \frac{n(n+1)}{2}, \qquad \sum_{i=1}^n i^2 = \frac{n(n+1)(2n+1)}{6}, \qquad \sum_{i=1}^n i^3 = \left(\frac{n(n+1)}{2}\right)^2.$$

**Proof by induction** (e.g. squares): true for $n = 1$; and
$$\frac{k(k+1)(2k+1)}{6} + (k+1)^2 = \frac{(k+1)\big(k(2k+1) + 6(k+1)\big)}{6} = \frac{(k+1)(k+2)(2k+3)}{6}.$$

**But how do you find the formula?** (Spivak says induction leaves this "a mystery", and Problem 2-6 gives the method.) Telescope $(i+1)^3 - i^3 = 3i^2 + 3i + 1$ from $i = 1$ to $n$:
$$(n+1)^3 - 1 = 3\sum i^2 + 3\cdot\frac{n(n+1)}{2} + n,$$
and solve for $\sum i^2$. The same trick with $(i+1)^{p+1} - i^{p+1}$ gives every $\sum i^p$ (Problem 2-7), and the leading term is always $\frac{n^{p+1}}{p+1}$.

**Geometric sums** (Problem 2-5): $1 + r + \cdots + r^n = \dfrac{1 - r^{n+1}}{1 - r}$ for $r \ne 1$. Proof: multiply by $1 - r$ and telescope.

### 4. Area Under $y = x$ on $[0, b]$ (Spivak's Example)

Split into $n$ equal pieces, $t_i = \frac{ib}{n}$. Since $f(x) = x$ is increasing, the min on $[t_{i-1}, t_i]$ is $t_{i-1}$ and the max is $t_i$:
$$L_n = \sum_{i=1}^n \frac{(i-1)b}{n}\cdot\frac bn = \frac{b^2}{n^2}\cdot\frac{(n-1)n}{2}, \qquad U_n = \sum_{i=1}^n\frac{ib}{n}\cdot\frac bn = \frac{b^2}{n^2}\cdot\frac{n(n+1)}{2}.$$
Both $\to \frac{b^2}{2}$, and $U_n - L_n = \frac{b^2}{n} \to 0$. The only number between all of them is $\frac{b^2}{2}$, the area of the triangle. ✓

### 5. Area Under $y = x^2$ on $[0, b]$

Same partition:
$$U_n = \sum_{i=1}^n\left(\frac{ib}{n}\right)^2\frac bn = \frac{b^3}{n^3}\sum_{i=1}^n i^2 = \frac{b^3}{n^3}\cdot\frac{n(n+1)(2n+1)}{6} = \frac{b^3}{6}\left(1 + \frac1n\right)\left(2 + \frac1n\right),$$
$$L_n = \frac{b^3}{n^3}\sum_{i=0}^{n-1}i^2 = \frac{b^3}{6}\left(1 - \frac1n\right)\left(2 - \frac1n\right).$$
Both $\to \frac{b^3}{3}$, and $U_n - L_n = \frac{b^3}{n} \to 0$. **Area $= \frac{b^3}{3}$.** That's Archimedes' result (the parabolic segment is $\frac13$ of the enclosing rectangle), done with a sum formula.

```plot
x: -0.2, 2.2
y: -0.4, 4.4
slider: n = 6, 1..60, 1 | $n$
f(x) = x^2 | $y = x^2$
riemann: f(x), 0..2, n, right | upper sum $U_n$ | orange
riemann: f(x), 0..2, n, left | lower sum $L_n$ | green
caption: $b = 2$, so the area is $\frac83 \approx 2.667$. $U_n$ and $L_n$ close in on it from both sides, and $U_n - L_n = \frac8n$.
```

Pattern: area under $x^p$ on $[0, b]$ is $\frac{b^{p+1}}{p+1}$, and $\frac{d}{db}\frac{b^{p+1}}{p+1} = b^p$. **The derivative of the area function is the original function.** That's the FTC, coming in Lecture 37.

### 6. Problems to Try

- **Ch. 2**: 1 (prove the power-sum formulas), 5 (geometric sums), 6 (derive $\sum i^2$ by telescoping).
- **Ch. 13**: 1 ($\int_0^b x^3\,dx = b^4/4$ with equal partitions), 2 ($x^4$), 3.

### Conclusion

Area is pinned between inner and outer rectangle sums. Sigma notation plus closed forms for $\sum i^p$ let us compute those sums exactly for equal partitions, and for $x$ and $x^2$ they squeeze down to $\frac{b^2}{2}$ and $\frac{b^3}{3}$. Next lecture turns "the only number between all the sums" into the definition of the integral.

## Related

- [[Calc I, Lecture 33: Antiderivatives]]
- [[Calc I, Lecture 35: The Definite Integral]]
- [[Calc I, Lecture 01: Real Numbers, Inequalities and Absolute Value]]
