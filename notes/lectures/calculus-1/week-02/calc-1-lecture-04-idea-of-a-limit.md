---
id: L-0007
title: "Calc I, Lecture 04: Tangents, Velocity and the Idea of a Limit"
course: Calculus I
lecture: 4
week: 2
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 5 (Limits, provisional definition) and Ch. 9 (Derivatives, motivation)"
summary: The tangent-line and velocity problems both lead to the same quotient, and making sense of what it approaches is what limits are for.
---

Two old problems, finding the **tangent line** to a curve and finding the **instantaneous velocity** of a moving particle, both reduce to the same expression, the **difference quotient** $\dfrac{f(a+h) - f(a)}{h}$. We can't just plug in $h = 0$, so we need to say what the quotient **approaches** as $h$ gets small. That's the idea of a **limit**, and today it's informal; next lecture it's made precise. Here's how it works:

### 1. The Tangent Line Problem

- "A line that touches the curve once" is a **bad definition** of tangent line: it's too strict for $x^3$ (the tangent at $(1,1)$ hits the curve again at $(-2,-8)$) and too loose for $|x|$ (lots of lines touch the V once at its corner).
- Better: take the **secant line** through $(a, f(a))$ and $(a + h, f(a+h))$, whose slope is
$$\frac{f(a+h) - f(a)}{h} \qquad (h \ne 0),$$
and let $h$ shrink. The tangent should be the "limiting position" of the secants. We can't take a limit of *lines* yet, but we can take a limit of their *slopes*.

**Example ($f(x) = x^2$):**
$$\frac{(a+h)^2 - a^2}{h} = \frac{2ah + h^2}{h} = 2a + h \qquad (h \ne 0).$$
As $h$ gets small this gets close to $2a$, so the tangent at $(a, a^2)$ should have slope $2a$.

```plot
x: -1.5, 3
y: -1.5, 8
slider: h = 1.5, -1.5..2 | $h$
f(x) = x^2 | $f(x) = x^2$
y = (2 + h)(x - 1) + 1 | secant, slope $2 + h$
y = 2(x - 1) + 1 | tangent, slope $2$ | dashed
point: (1, 1) | $(1, 1)$
point: (1 + h, f(1 + h)) | $(1 + h, f(1 + h))$
caption: The example with $a = 1$. Drag $h$ towards $0$ (from either side) and the secant swings onto the tangent. At $h = 0$ itself there's no secant, just the formula.
```

Notice the cancellation of $h$ is legal **only because $h \ne 0$**. The quotient isn't even defined at $h = 0$. That's exactly why we need limits rather than just "plugging in".

### 2. The Velocity Problem

A particle on a line is at position $s(t)$ at time $t$. The **average velocity** over $[a, a + h]$ is $\dfrac{s(a+h) - s(a)}{h}$, the same quotient again. "Velocity at time $a$" has to mean what these averages approach as $h \to 0$.

**Example (falling body, $s(t) = 16t^2$ ft):** average velocity over $[1, 1+h]$ is
$$\frac{16(1+h)^2 - 16}{h} = 32 + 16h \;\longrightarrow\; 32 \text{ ft/s}.$$

Spivak's remark (Ch. 9): instantaneous velocity is a **theoretical concept**; any physical measurement is really an average over a small time interval.

### 3. The Provisional Definition

> [!definition] Limit (provisional, Spivak Ch. 5)
> $f$ **approaches the limit $l$ near $a$** if we can make $f(x)$ as close as we like to $l$ by requiring that $x$ be sufficiently close to, **but unequal to**, $a$.

Key features:

1. **The value $f(a)$ is irrelevant.** $f$ needn't even be defined at $a$ (like the difference quotient at $h = 0$), and if it is defined, it can be "wrong". Only values **near** $a$ count.
2. **"As close as we like"** is a challenge–response game: you name a tolerance around $l$, I must find a neighbourhood of $a$ that works. Spivak's picture: for any target interval $B$ around $l$ there must be an interval $A$ around $a$ whose points (except $a$) all map into $B$. Smaller $B$ usually forces smaller $A$.

### 4. Examples (Informal for Now)

1. **$\dfrac{x^2 - 1}{x - 1}$ near $1$**: equals $x + 1$ for $x \ne 1$, so it approaches $2$, even though it's undefined at $1$.
2. **$x \sin(1/x)$ near $0$**: since $|\sin(1/x)| \le 1$, we get $|x \sin(1/x)| \le |x|$. To get within $\tfrac{1}{10}$ of $0$, take $|x| < \tfrac{1}{10}$. To get within any $\varepsilon$, take $|x| < \varepsilon$. **Approaches 0.**
3. **$x^2 \sin(1/x)$ near $0$**: $|x^2 \sin(1/x)| \le x^2$, so $|x| < \sqrt{\varepsilon}$ (or more lazily $|x| < \varepsilon$ when $\varepsilon \le 1$) works. **Approaches 0.**
4. **$\sin(1/x)$ near $0$**: in every interval around $0$ there are points where it equals $1$ and points where it equals $-1$, so it can't stay within $\tfrac12$ of any single number $l$. **No limit.**
5. **The sign function** ($-1$ for $x < 0$, $1$ for $x > 0$): approaches $1$ near any $a > 0$ (take $|x - a| < a$, which keeps $x > 0$), approaches $-1$ near any $b < 0$, and approaches **nothing** near $0$.

### 5. Why This Isn't Good Enough Yet

Every "proof" above was really an argument with the precise definition we haven't written down. "Make it as close as we like" and "sufficiently close" aren't precise enough to prove theorems with. Spivak's move is to notice the **common pattern** in all the examples: for each tolerance $\varepsilon > 0$ we produced a $\delta > 0$. That pattern *is* the definition, and it's the subject of Lecture 5.

### 6. Problems to Try

- **Ch. 5**: 1 and 2 (compute limits after algebra), 9 ($\lim_{x \to a} f(x) = \lim_{h \to 0} f(a+h)$, which we'll use constantly for derivatives).
- **Ch. 9**: 1 (derivative of $1/x$ from the definition: try it informally now, do it properly after Lecture 6).

### Conclusion

Tangent slopes and instantaneous velocities are both "what $\frac{f(a+h) - f(a)}{h}$ approaches as $h \to 0$". The value at the point itself is irrelevant, and some functions approach nothing at all. To prove anything we need a precise version of "approaches", and the examples above already show what it has to look like.

## Related

- [[Calc I, Lecture 03: Graphs and the Basic Functions]]
- [[Calc I, Lecture 05: The Epsilon-Delta Definition of a Limit]]
- [[Calc I, Lecture 12: The Derivative]]
