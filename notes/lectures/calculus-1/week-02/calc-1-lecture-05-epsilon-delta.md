---
id: L-0008
title: "Calc I, Lecture 05: The Epsilon-Delta Definition of a Limit"
course: Calculus I
lecture: 5
week: 2
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 5 (Limits)"
summary: The precise definition of a limit, how to negate it, epsilon-delta proofs for x, x squared and x cubed, and the uniqueness of limits.
---

The **ε–δ definition** says $\lim_{x \to a} f(x) = l$ means: for every $\varepsilon > 0$ there is a $\delta > 0$ such that $0 < |x - a| < \delta$ implies $|f(x) - l| < \varepsilon$. Today: how Spivak gets there step by step from the provisional definition, how to **negate** it, how to actually **find $\delta$**, and the first theorem, that a function can't approach **two different limits**. Here's how it works:

### 1. Getting From Words to Symbols

Spivak refines the provisional definition one phrase at a time:

1. "$f(x)$ close to $l$" → "$|f(x) - l|$ small"; "$x$ close to $a$ but $\ne a$" → "$|x - a|$ small and $x \ne a$".
2. "As small as we like" → "less than **any** $\varepsilon > 0$ that we're handed".
3. "Sufficiently small" → "less than **some** $\delta > 0$".
4. "$|x - a| < \delta$ and $x \ne a$" → $0 < |x - a| < \delta$.

> [!definition] Limit (Spivak Ch. 5)
> The function $f$ **approaches the limit $l$ near $a$**, written $\lim_{x \to a} f(x) = l$, means: for every $\varepsilon > 0$ there is some $\delta > 0$ such that, for all $x$,
> $$\text{if } 0 < |x - a| < \delta, \text{ then } |f(x) - l| < \varepsilon.$$

Spivak says to memorize this "like a poem" if necessary, because stating it wrong guarantees wrong proofs.

- The **$0 <$** part is what makes $f(a)$ irrelevant.
- **Order of quantifiers matters**: $\delta$ is allowed to depend on $\varepsilon$ (and on $a$), never the other way round.
- Implicitly, $f$ has to be defined on some punctured interval $0 < |x - a| < \delta_0$, or the condition doesn't make sense.

### 2. Negating the Definition

$\lim_{x \to a} f(x) = l$ is **false** means:

> there is some $\varepsilon > 0$ such that for every $\delta > 0$ there is some $x$ with $0 < |x - a| < \delta$ but $|f(x) - l| \ge \varepsilon$.

**Example ($\sin(1/x)$ doesn't approach $0$ at $0$):** take $\varepsilon = \tfrac12$. For any $\delta > 0$, choose $n$ so large that $x = \dfrac{1}{\pi/2 + 2\pi n} < \delta$; then $\sin(1/x) = 1$, so $|\sin(1/x) - 0| \ge \tfrac12$. (Spivak writes these points in degrees, $1/(90 + 360n)$, before radians are defined, but it's the same idea.) The same $\varepsilon = \tfrac12$ beats **every** $l$, because the points $x_2 = 1/(3\pi/2 + 2\pi m)$ give the value $-1$, and no interval of length $1$ contains both $1$ and $-1$.

### 3. Finding δ: The Standard Proofs

**(a) $\lim_{x \to a} c = c$**: any $\delta$ works, since $|c - c| = 0 < \varepsilon$.

**(b) $\lim_{x \to a} x = a$**: take $\delta = \varepsilon$.

**(c) $\lim_{x \to a} x^2 = a^2$.** We need $|x^2 - a^2| = |x - a|\,|x + a| < \varepsilon$. The factor $|x - a|$ we control; the factor $|x + a|$ we just need to **bound**.

> [!proof] Claim: $\delta = \min\left(1, \dfrac{\varepsilon}{2|a| + 1}\right)$ works.
> If $|x - a| < 1$, then by the reverse triangle inequality $|x| - |a| \le |x - a| < 1$, so $|x| < |a| + 1$ and $|x + a| \le |x| + |a| < 2|a| + 1$. If also $|x - a| < \varepsilon / (2|a| + 1)$, then
> $$|x^2 - a^2| = |x - a|\,|x + a| < \frac{\varepsilon}{2|a|+1}\,(2|a|+1) = \varepsilon.$$

**The trick to remember:** first restrict $|x - a| < 1$ to **tame the bad factor**, then shrink $\delta$ further to handle $\varepsilon$, and take the **min** of the two requirements.

```plot
x: -0.3, 2.3
y: -0.4, 3.4
slider: ε = 1, 0.1..2 | $\varepsilon$
f(x) = x^2 | $f(x) = x^2$
hband: 1 - ε, 1 + ε | $|f(x) - 1| < \varepsilon$
vband: 1 - min(1, ε/3), 1 + min(1, ε/3) | $0 < |x - 1| < \delta$
point: (1, 1)
caption: Example (c) with $a = 1$, so $\delta = \min(1, \varepsilon/3)$. However small you make $\varepsilon$, the piece of the graph over the $\delta$-strip stays inside the $\varepsilon$-strip.
```

**(d) $\lim_{x \to a} x^3 = a^3$**: same trick with $x^3 - a^3 = (x - a)(x^2 + ax + a^2)$. If $|x - a| < 1$ then $|x^2 + ax + a^2| < (1 + |a|)^2 + |a|(1 + |a|) + |a|^2 =: M$, so $\delta = \min(1, \varepsilon / M)$ works.

**(e) $\lim_{x \to 0} x \sin(1/x) = 0$**: $|x \sin(1/x)| \le |x|$, so $\delta = \varepsilon$. For $|x|\sin(1/x)$ the same; for $x^2 \sin(1/x)$, $\delta = \min(1, \varepsilon)$.

### 4. A Real Example: Thomae's Function

Spivak's "most complicated" example: on $(0, 1)$ let $f(x) = 0$ for irrational $x$ and $f(p/q) = 1/q$ for $p/q$ in lowest terms.

> [!theorem]
> For every $a \in (0, 1)$, $\lim_{x \to a} f(x) = 0$.

> [!proof]
> Given $\varepsilon > 0$, pick $n$ with $1/n \le \varepsilon$. The only $x$ where $|f(x)| \ge \varepsilon$ can happen are rationals with denominator $q < n$, i.e. $\tfrac12; \tfrac13, \tfrac23; \ldots; \tfrac1{n-1}, \ldots, \tfrac{n-2}{n-1}$. That's a **finite** list. Let $\delta$ be the distance from $a$ to the closest of them (other than $a$ itself). Then $0 < |x - a| < \delta$ means $x$ is not on the list, so $|f(x)| < \varepsilon$.

Note that $\delta$ doesn't need a formula. "The smallest of finitely many positive distances" is a perfectly good $\delta$.

### 5. Uniqueness of Limits

> [!theorem] Spivak Theorem 5-1
> If $f$ approaches $l$ near $a$ and also approaches $m$ near $a$, then $l = m$.

> [!proof]
> Given $\varepsilon$, there are $\delta_1, \delta_2$ for $l$ and $m$; with $\delta = \min(\delta_1, \delta_2)$ both conclusions hold at once. Suppose $l \ne m$ and use $\varepsilon = |l - m|/2$. For any $x$ with $0 < |x - a| < \delta$,
> $$|l - m| \le |l - f(x)| + |f(x) - m| < \tfrac{|l-m|}{2} + \tfrac{|l-m|}{2} = |l - m|,$$
> a contradiction.

This is what makes the notation $\lim_{x \to a} f(x)$ legitimate: it names one number. The $x$ in it is a dummy variable ($\lim_{x\to a} f(x) = \lim_{t \to a} f(t)$).

### 6. Problems to Try

- **Ch. 5**: 3 (find $\delta$ for $x^4$, $1/x$, etc.), 7 (a $\delta$ that works for $\varepsilon$ need not work for $\varepsilon/2$ with $\delta/2$), 17 ($\lim_{x\to0} 1/x$ doesn't exist), 19 (rationals indicator has no limits), 20 ($x$ on rationals, $-x$ on irrationals), 25 and 26 (correct and incorrect variants of the definition).

### Conclusion

The ε–δ definition is the provisional idea with every vague phrase replaced by a quantifier. Proving a limit means producing $\delta$ from $\varepsilon$, usually by bounding the "bad factor" first and taking a min. Disproving one means producing a single bad $\varepsilon$. Uniqueness of limits is the first test the definition passes.

## Related

- [[Calc I, Lecture 04: Tangents, Velocity and the Idea of a Limit]]
- [[Calc I, Lecture 06: The Limit Laws]]
- [[Calc I, Lecture 01: Real Numbers, Inequalities and Absolute Value]]
