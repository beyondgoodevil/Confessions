---
id: L-0021
title: "Calc I, Lecture 17: Derivatives of the Trigonometric Functions"
course: Calculus I
lecture: 17
week: 6
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 15 (The Trigonometric Functions), Theorems 1, 2, 4, 5 and Problem 27"
summary: Radian measure, the classical proof that sin' = cos using sin x / x, the derivatives of tan, sec, csc and cot, why degrees give the wrong answer, and how Spivak defines sin and cos rigorously.
---

$\sin' = \cos$ and $\cos' = -\sin$, **provided angles are measured in radians**. The classical proof uses the addition formula together with the two limits from Lecture 8, $\frac{\sin h}{h} \to 1$ and $\frac{1 - \cos h}{h} \to 0$. The quotient rule then gives $\tan' = \sec^2$ and the rest. Spivak himself goes the other way round: he **defines** $\sin$ and $\cos$ via areas (using integrals) and **derives** the addition formulas from the derivatives. Here's how it works:

### 1. Radians

- A number $x$ determines the point $P$ on the unit circle reached by going **arc length $x$** counterclockwise from $(1, 0)$; $\cos x$ and $\sin x$ are $P$'s coordinates.
- Equivalently (Spivak's version), the **sector** cut out has **area $x/2$**. That's the formulation that can be made rigorous, since area is an integral (Lecture 35).
- Degrees are the same idea with the circle chopped into 360 instead of $2\pi$. Spivak's point: "$x$ in degrees or radians?" really means "do you mean the function $\sin$ or the function $\sin^\circ$?", since a number doesn't carry units.

### 2. The Classical Proof

> [!theorem]
> For all $x$: $\sin'(x) = \cos x$ and $\cos'(x) = -\sin x$.

> [!proof] Via the addition formula and Lecture 8
> Using $\sin(x + h) = \sin x\cos h + \cos x\sin h$:
> $$\frac{\sin(x+h) - \sin x}{h} = \sin x\cdot\frac{\cos h - 1}{h} + \cos x\cdot\frac{\sin h}{h} \;\to\; \sin x\cdot 0 + \cos x\cdot 1 = \cos x.$$
> Similarly, using $\cos(x + h) = \cos x\cos h - \sin x\sin h$:
> $$\frac{\cos(x+h) - \cos x}{h} = \cos x\cdot\frac{\cos h - 1}{h} - \sin x\cdot\frac{\sin h}{h} \;\to\; -\sin x.$$

This is Spivak's Problem 15-27(d). It needs the addition formula (from geometry) and the sector-area fact behind $\sin h / h \to 1$.

### 3. Spivak's Rigorous Route (Preview of Ch. 15)

This is what actually happens in the book, once integrals are available:

1. **Define** $\pi = 2\int_{-1}^1\sqrt{1 - x^2}\,dx$ (twice the area of the upper half disc).
2. **Define** $A(x) = \dfrac{x\sqrt{1 - x^2}}{2} + \int_x^1\sqrt{1 - t^2}\,dt$ for $-1 \le x \le 1$, the area of the sector from $(1, 0)$ to $(x, \sqrt{1 - x^2})$. It decreases from $A(-1) = \pi/2$ to $A(1) = 0$, and the FTC gives $A'(x) = \dfrac{-1}{2\sqrt{1 - x^2}}$.
3. **Define** $\cos x$ for $0 \le x \le \pi$ as the unique number with $A(\cos x) = x/2$ (it exists by the IVT!), and $\sin x = \sqrt{1 - \cos^2 x}$.
4. Then $\cos$ is the inverse of $B = 2A$, so by the **inverse function rule** (Lecture 19), $\cos'(x) = \dfrac{1}{B'(\cos x)} = -\sqrt{1 - \cos^2 x} = -\sin x$, and the chain rule gives $\sin' = \cos$ (Theorem 15-1).
5. Extend to all of $\mathbb{R}$ by symmetry and $2\pi$-periodicity.
6. **Addition formulas are then theorems.** Lemma: if $f'' + f = 0$ and $f(0) = f'(0) = 0$, then $f = 0$ (since $(f'^2 + f^2)' = 2f'(f'' + f) = 0$). Hence any $f$ with $f'' + f = 0$ is $f = f'(0)\sin + f(0)\cos$ (Theorem 15-4), and applying that to $f(x) = \sin(x + y)$ gives $\sin(x + y) = \sin x\cos y + \cos x\sin y$ (Theorem 15-5).

So in Spivak, $\lim \frac{\sin x}{x} = 1$ is just $\sin'(0) = \cos 0$. **No circularity**, which is the reason for doing it this way.

### 4. The Other Four

> [!theorem] Spivak Theorem 15-2
> $\tan' = \sec^2$, $\quad\sec' = \sec\tan$, $\quad\cot' = -\csc^2$, $\quad\csc' = -\csc\cot$
> (wherever the functions are defined).

> [!proof] Two of them
> $\tan' = \left(\frac{\sin}{\cos}\right)' = \frac{\cos^2 + \sin^2}{\cos^2} = \frac{1}{\cos^2} = \sec^2$.
> $\sec' = \left(\frac1\cos\right)' = \frac{\sin}{\cos^2} = \frac1\cos\cdot\frac{\sin}{\cos} = \sec\tan$.

Memory aid: the "co-" functions get a minus sign and swap $\tan \leftrightarrow \cot$, $\sec \leftrightarrow \csc$.

### 5. Worked Examples

1. $(\sin 3x)' = 3\cos 3x$; $\big(\cos(x^2)\big)' = -2x\sin(x^2)$.
2. $(\tan^3 x)' = 3\tan^2 x\sec^2 x$.
3. $\big(\sec\sqrt x\big)' = \sec\sqrt x\tan\sqrt x\cdot\dfrac{1}{2\sqrt x}$.
4. $(x^2\cos x)'' = (2x\cos x - x^2\sin x)' = 2\cos x - 4x\sin x - x^2\cos x$.
5. **$y = \sin x$ solves $y'' + y = 0$**, and so does $y = a\sin x + b\cos x$. By Theorem 15-4 these are **all** the solutions. This is simple harmonic motion.
6. **The degree trap** (Problem 15-21): $\sin^\circ(x) = \sin\left(\dfrac{\pi x}{180}\right)$, so $(\sin^\circ)'(x) = \dfrac{\pi}{180}\cos^\circ(x)$. The ugly constant is why calculus uses radians.

### 6. Problems to Try

- **Ch. 10**: 3 (tan, cot, sec, csc).
- **Ch. 15**: 1 (differentiate), 6 (addition formula for $\cos$), 7 ($\sin 2x$, $\cos 2x$, etc.), 18, 21 (degrees), 25 ($|\sin x - \sin y| < |x - y|$, via the MVT later), 27 (the classical approach, all parts).

### Conclusion

In radians, $\sin' = \cos$ and $\cos' = -\sin$. Classically this follows from the addition formulas plus $\frac{\sin h}{h} \to 1$ and $\frac{1 - \cos h}{h} \to 0$. Spivak's route defines $\sin$ and $\cos$ through sector areas and gets the derivatives first and the addition formulas as theorems. Either way, the quotient rule then handles $\tan$, $\sec$, $\cot$ and $\csc$.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 08: The Squeeze Theorem and sin x over x]]
- [[Calc I, Lecture 16: The Chain Rule]]
- [[Calc I, Lecture 18: Implicit Differentiation]]
- [[Calc I, Lecture 20: Inverse Trigonometric Functions]]
