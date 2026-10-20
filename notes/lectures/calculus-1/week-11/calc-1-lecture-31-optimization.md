---
id: L-0035
title: "Calc I, Lecture 31: Optimization"
course: Calculus I
lecture: 31
week: 11
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 11 (Significance of the Derivative), Problems 6-18, 29-30"
summary: Turning a word problem into maximizing or minimizing a function of one variable on the right domain, then justifying the answer; rectangles, cans, boxes, the ladder around a corner, reflection, and the cannonball.
---

**Optimization** means finding the biggest or smallest value of some quantity subject to a **constraint**. The mathematical part is Lectures 25–28 (critical points, the closed-interval method, first and second derivative tests). The real work is the **setup**: write the quantity as a function of **one** variable, find its **domain**, and then **prove** the critical point you found is the global optimum. Spivak's Ch. 11 problems are the source for most of these, and he comments that such problems are fun until you've done your first hundred. Here's how it works:

### 1. The Method

1. **Picture and variables.** Name everything.
2. **Objective**: the quantity to maximize/minimize, in terms of the variables.
3. **Constraint**: use it to eliminate all but **one** variable.
4. **Domain**: the physically meaningful interval (often open or infinite!).
5. **Find critical points** and compare with endpoints/limits.
6. **Justify it's the global optimum**: closed interval method; or "only one critical point, and $f \to \infty$ at the ends"; or the sign of $f'$ (first derivative test on the whole domain); or $f'' > 0$ everywhere (convex ⇒ any critical point is the global min).

Skipping step 6 is the most common way to lose points.

### 2. Worked Examples

1. **Rectangle with fixed perimeter $P$** (Problem 11-9). Sides $x$ and $\frac P2 - x$, area $A(x) = x\left(\frac P2 - x\right)$ on $[0, \frac P2]$. $A'(x) = \frac P2 - 2x = 0$ at $x = \frac P4$. Endpoints give $A = 0$, so **the max is the square**, with area $\frac{P^2}{16}$.

2. **Cylinder of fixed volume $V$, least surface area** (Problem 11-10). $V = \pi r^2h$, so $h = \frac{V}{\pi r^2}$ and
$$S(r) = 2\pi r^2 + 2\pi rh = 2\pi r^2 + \frac{2V}{r}, \qquad r \in (0, \infty).$$
$S'(r) = 4\pi r - \frac{2V}{r^2} = 0 \Rightarrow r^3 = \frac{V}{2\pi}$. Then $h = \frac{V}{\pi r^2} = \frac{2\pi r^3}{\pi r^2} = 2r$. **Height = diameter.** Global min: $S'' = 4\pi + \frac{4V}{r^3} > 0$, so $S$ is convex on $(0, \infty)$ and the only critical point is the global min. (Also $S \to \infty$ at both ends.)

3. **Open box from a $12 \times 12$ sheet**: cut $x \times x$ squares from the corners. $V(x) = x(12 - 2x)^2$ on $[0, 6]$. $V'(x) = (12 - 2x)^2 - 4x(12 - 2x) = (12 - 2x)(12 - 6x)$, zero at $x = 2$ (and $x = 6$, an endpoint). $V(0) = V(6) = 0$, $V(2) = 128$. **Max $128$ at $x = 2$.**

4. **A number plus its reciprocal** (Problem 11-14): $f(x) = x + \frac1x$ on $(0, \infty)$. $f'(x) = 1 - \frac{1}{x^2}$: negative on $(0, 1)$, positive on $(1, \infty)$. So **$x + \frac1x \ge 2$**, with equality iff $x = 1$. (It's also AM–GM: $\frac{x + 1/x}{2} \ge \sqrt{x\cdot\frac1x}$.)

5. **Ladder around a corner** (Problem 11-12). Hallways of widths $a$ and $b$ meet at a right angle. A ladder that touches the inner corner and makes angle $\theta$ with one wall has length
$$L(\theta) = \frac{a}{\cos\theta} + \frac{b}{\sin\theta}, \qquad 0 < \theta < \frac\pi2.$$
The **longest ladder that fits** is the **minimum** of $L$ (it has to fit at every angle). $L'(\theta) = \frac{a\sin\theta}{\cos^2\theta} - \frac{b\cos\theta}{\sin^2\theta} = 0 \iff \tan^3\theta = \frac ba$. Plugging in gives
$$L_{\min} = \left(a^{2/3} + b^{2/3}\right)^{3/2}.$$
$L \to \infty$ at both ends of $(0, \frac\pi2)$, so this really is the min. For $a = b$ it's $2\sqrt2\,a$.

6. **Reflection** (Problem 11-8). Go from $(0, a)$ to a point $(x, 0)$ on the axis and then to $(1, b)$. Total length $\ell(x) = \sqrt{x^2 + a^2} + \sqrt{(1 - x)^2 + b^2}$, and
$$\ell'(x) = \frac{x}{\sqrt{x^2 + a^2}} - \frac{1 - x}{\sqrt{(1 - x)^2 + b^2}} = 0$$
says exactly that the two angles with the axis have equal cosines: **angle of incidence = angle of reflection**. Light takes the shortest path (Heron, and later Fermat's principle).

7. **Cannonball range** (Problem 11-30). Initial speed $v$ at angle $\alpha$: height $s(t) = -16t^2 + (v\sin\alpha)t$, which is $0$ again at $t = \frac{v\sin\alpha}{16}$. The horizontal distance is then $v\cos\alpha\cdot\frac{v\sin\alpha}{16} = \frac{v^2\sin2\alpha}{32}$, **maximized at $\alpha = \frac\pi4$**.

8. **Closest point on a line** (Problem 11-6): minimizing distance from $(x_0, y_0)$ to $y = mx + b$, it's easier to minimize the **squared** distance (same minimizer, no square roots). The answer has the connecting segment perpendicular to the line, and the distance to $Ax + By + C = 0$ is $\dfrac{|Ax_0 + By_0 + C|}{\sqrt{A^2 + B^2}}$.

### 3. Tricks Worth Remembering

- **Minimize the square** of a distance instead of the distance.
- **Monotone transformations** don't move the optimizer: maximizing $f$ is the same as maximizing $\log f$ (when $f > 0$), or $f^2$ (when $f \ge 0$).
- If the domain is open or infinite, check **limits at the ends** to know a max/min **exists**.
- **Sanity checks**: symmetric problems often have symmetric answers (square, $h = 2r$, $45°$).

### 4. Problems to Try

- **Ch. 11**: 6, 8, 9, 10, 11 (cone of max volume), 12, 13 (garden sector), 15 (trapezoid in a semicircle), 16, 17 (Ecological Ed and the lake: the max and min are both at endpoints!), 18 (folded page), 29, 30.

### Conclusion

An optimization problem is a closed-interval or first-derivative-test problem after a careful setup: one variable, the right domain, and an argument that the critical point is a **global** optimum. The calculus is short. Most of the thinking goes into the setup and the justification.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 25: Maxima, Minima and Critical Points]]
- [[Calc I, Lecture 28: Concavity and the Second Derivative]]
- [[Calc I, Lecture 32: Newton's Method]]
