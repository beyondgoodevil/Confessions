---
id: L-0036
title: "Calc I, Lecture 33: Antiderivatives"
course: Calculus I
lecture: 33
week: 11
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 11 (Corollary 2, Problems 28-29) and Ch. 19 (Integration in Elementary Terms, table of primitives)"
summary: Primitives (antiderivatives), why on an interval they differ only by a constant, the basic table, initial value problems such as falling bodies, and why not every function has an antiderivative.
---

An **antiderivative** (Spivak's word is **primitive**) of $f$ is a function $F$ with $F' = f$. By the MVT corollary from Lecture 27, on an **interval** any two antiderivatives **differ by a constant**, so once you know one you know them all: $F + C$. Running the differentiation table backwards gives the basic primitives, and fixing the constant with an **initial condition** solves simple differential equations like $s'' = -32$. Here's how it works:

### 1. Definition and Uniqueness

> [!definition] Primitive (Spivak Ch. 19)
> $F$ is a **primitive** (antiderivative) of $f$ if $F' = f$. The symbol $\int f(x)\,dx$ denotes "a primitive of $f$", or more precisely the collection of all of them.

> [!theorem] Spivak Corollary 11-2
> If $F' = G'$ on an interval, then $F = G + C$ for some constant $C$.

So **on an interval**, all primitives of $f$ are $F + C$. Spivak notes that writing "$+ C$" every time is technically right but mostly an annoyance. His Problem 19-13 shows how forgetting it can produce a fake contradiction.

**Off an interval it's false:** on $\mathbb{R}\setminus\{0\}$, the primitives of $1/x$ are
$$F(x) = \begin{cases}\log x + C_1 & x > 0\\ \log(-x) + C_2 & x < 0\end{cases}$$
with **two independent constants**.

### 2. The Basic Table

Every differentiation formula read backwards (Spivak's table at the start of Ch. 19):

| $f(x)$ | a primitive |
|---|---|
| $x^n$ ($n \ne -1$) | $\dfrac{x^{n+1}}{n+1}$ |
| $\dfrac1x$ | $\log\lvert x\rvert$ |
| $e^x$ | $e^x$ |
| $\sin x$ | $-\cos x$ |
| $\cos x$ | $\sin x$ |
| $\sec^2 x$ | $\tan x$ |
| $\sec x\tan x$ | $\sec x$ |
| $\dfrac{1}{1 + x^2}$ | $\arctan x$ |
| $\dfrac{1}{\sqrt{1 - x^2}}$ | $\arcsin x$ |

Plus **linearity**: $\int(f + g) = \int f + \int g$ and $\int cf = c\int f$. Checking a primitive is easy: **differentiate it**. Finding one can be hard.

### 3. Initial Value Problems

Knowing $F'$ **and** one value $F(x_0)$ determines $F$ completely on an interval.

1. **Falling bodies** (Problem 11-29). Measure height upward; gravity gives $s''(t) = -32$ ft/s². Then
   - $s'(t) = -32t + \alpha$; setting $t = 0$: $\alpha = s'(0) = v_0$.
   - $s(t) = -16t^2 + v_0t + \beta$; setting $t = 0$: $\beta = s_0$.
   - So **$s(t) = -16t^2 + v_0t + s_0$**. Thrown up from the ground at $v_0$: the top is at $s' = 0$, i.e. $t = v_0/32$, height $\frac{v_0^2}{64}$; it lands at $t = v_0/16$ with velocity $-v_0$. At the top the velocity is $0$ but the acceleration is still $-32$.
2. **Find all $f$ with $f'(x) = x + x^2$** (Problem 11-28(c)): $f(x) = \frac{x^2}{2} + \frac{x^3}{3} + C$.
3. **$f'' = x^3$** (Problem 11-28(b)): integrate twice to get $f(x) = \frac{x^5}{20} + C_1x + C_2$, with **two** constants for a second-order equation.
4. **$f'(x) = \cos x - 3e^x$, $f(0) = 2$**: $f(x) = \sin x - 3e^x + C$ and $2 = 0 - 3 + C$, so $C = 5$.
5. **Exponential growth** (Lecture 21): $f' = kf$ has solutions exactly $Ce^{kx}$. This is the same "derivative determines the function up to a constant" idea, applied to $f/e^{kx}$.

### 4. Not Every Function Has a Primitive

- **Jumps are impossible**: by Theorem 11-7, if $f'$ has a limit at $a$ it equals $f'(a)$, so a derivative **can't have a jump discontinuity**. The sign function, for example, has no primitive on any interval around $0$. (Darboux's theorem, Problem 11-54, says more: derivatives always have the intermediate value property.)
- **Elementary vs. existing**: $e^{-x^2}$ is continuous, so it **has** a primitive (by the FTC, Lecture 37), but Spivak points out it's a (difficult) theorem that **no elementary function** is a primitive of it. "No formula" doesn't mean "doesn't exist" (back to Lecture 2).

### 5. Where This Is Going

Antiderivatives are the computational side of integration. The **Fundamental Theorem of Calculus** will say that for continuous $f$,
$$\int_a^b f(x)\,dx = F(b) - F(a) \quad\text{for any primitive } F,$$
where the left side is defined as an **area** (Lectures 34–36), not as $F(b) - F(a)$. Spivak insists repeatedly that this is a theorem, not a definition.

### 6. Problems to Try

- **Ch. 10**: 20 (primitives of polynomials).
- **Ch. 11**: 28, 29, 30, 54 (Darboux).
- **Ch. 19**: 2 (easy primitives you should "see", the start of substitution practice for Lecture 38).

### Conclusion

A primitive undoes differentiation. On an interval it's unique up to an additive constant (MVT), and an initial value pins that constant down. Reading the derivative table backwards gives the basic primitives, but some functions have no primitive at all (derivatives can't jump), and some have one that no formula expresses. The connection between primitives and areas is the main theorem of the last two weeks.

## Related

- [[Calc I, Lecture 27: Monotonicity and the First Derivative Test]]
- [[Calc I, Lecture 34: Areas and Sigma Notation]]
- [[Calc I, Lecture 37: The Fundamental Theorem of Calculus]]
