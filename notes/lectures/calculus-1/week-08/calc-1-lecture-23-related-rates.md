---
id: L-0027
title: "Calc I, Lecture 23: Related Rates"
course: Calculus I
lecture: 23
week: 8
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 10 (Differentiation), Problems 7-9 and the chain rule"
summary: When two time-dependent quantities are tied by an equation, differentiating the equation in t ties their rates together; a five-step method and worked examples (circles, ladders, cones, moving points).
---

If two quantities that change with time are linked by an equation (area and radius, the two legs of a sliding ladder), then **differentiating the equation with respect to $t$** links their **rates of change**. That's a **related rates** problem. Mathematically it's just the chain rule (Lecture 16) applied to functions of time, and Spivak sets it up in Problems 10-7 to 10-9 with the warning to name the functions explicitly. Here's how it works:

### 1. The Idea

If $A(t) = \pi r(t)^2$ for all $t$, then by the chain rule
$$A'(t) = 2\pi r(t)\,r'(t).$$
So at any moment, the rate of change of area is determined by the radius and the rate of change of the radius.

**Spivak's Problem 10-7(a):** a circle grows in some unspecified way, but when the radius is $6$ the radius is growing at rate $4$. Then at that moment $A' = 2\pi\cdot6\cdot4 = 48\pi$. We don't need to know *how* $r$ depends on $t$, just its value and rate at that instant.

> [!note] Spivak's hint
> Write $r(t)$ and $A(t)$ as **functions of $t$**, not just letters. The whole content of the problem is the equation $A(t) = \pi r(t)^2$ holding **for all $t$**, which is what lets you differentiate it.

### 2. The Method

1. **Draw a picture** and name every changing quantity as a function of $t$.
2. **Write an equation** relating them that holds **for all $t$** (geometry: Pythagoras, similar triangles, area/volume formulas).
3. **Differentiate both sides in $t$** (chain rule on every term).
4. **Only now plug in** the numbers for the particular instant.
5. Solve for the unknown rate and **check the sign** (is it growing or shrinking?) and units.

The classic mistake is plugging in the instantaneous values **before** differentiating, which turns variables into constants and kills their derivatives.

### 3. Worked Examples

1. **Sliding ladder.** A 10 ft ladder leans on a wall; the bottom slides away at 2 ft/s. How fast is the top sliding down when the bottom is 6 ft out?
   - $x(t)$ = distance of the foot from the wall, $y(t)$ = height of the top. For all $t$: $x(t)^2 + y(t)^2 = 100$.
   - Differentiate: $2xx' + 2yy' = 0$, so $y' = -\dfrac{x}{y}x'$.
   - At the instant: $x = 6$, $y = 8$, $x' = 2$, so $y' = -\tfrac68\cdot 2 = -\tfrac32$ ft/s. **Sliding down at 1.5 ft/s.**
   - Note: as $y \to 0^+$, $y' = -\frac xy x' \to -\infty$. The model breaks down (the ladder leaves the wall).

2. **Filling a cone.** Water pours at $2$ m³/min into an inverted cone with height $4$ m and top radius $2$ m. How fast is the level rising when the water is $1$ m deep?
   - Similar triangles: $r = h/2$ at every moment, so $V = \frac13\pi r^2h = \frac{\pi}{12}h^3$.
   - $V' = \frac\pi4 h^2 h'$, so $h' = \dfrac{4V'}{\pi h^2} = \dfrac{8}{\pi}$ m/min $\approx 2.55$ m/min at $h = 1$.
   - The key step was **eliminating $r$** before differentiating, since we know nothing about $r'$ directly.

3. **Annulus (modelled on Problem 10-8).** Two concentric circles change so that the area between them stays constant. If the big circle's area grows at $10$ cm²/s, how fast is the **small** circle's circumference changing when its radius is $2$ cm?
   - $A_{\text{big}}(t) - A_{\text{small}}(t) = \text{const}$, so $A_{\text{small}}' = A_{\text{big}}' = 10$.
   - $A_s = \pi r^2 \Rightarrow A_s' = 2\pi rr' \Rightarrow r' = \dfrac{10}{2\pi\cdot2} = \dfrac{5}{2\pi}$.
   - $C = 2\pi r \Rightarrow C' = 2\pi r' = 5$ cm/s.

4. **Two moving points** (the setup of Problem 10-9). Point $A$ moves right along the $x$-axis and $B$ moves up the $y$-axis. At some instant $A = (3, 0)$ moving at $2$ units/s and $B = (0, 4)$ moving at $1$ unit/s. How fast is the distance between them changing?
   - $D(t)^2 = a(t)^2 + b(t)^2$, so $DD' = aa' + bb'$.
   - $D = 5$, so $D' = \dfrac{3\cdot2 + 4\cdot1}{5} = 2$ units/s.

5. **Shadow.** A 6 ft person walks away from a 15 ft lamppost at 5 ft/s. How fast does the tip of the shadow move?
   - Let $x$ = person's distance from the post and $s$ = shadow length. Similar triangles: $\frac{15}{x + s} = \frac6s$, so $15s = 6x + 6s$ and $s = \frac23x$.
   - Tip at $x + s = \frac53x$, moving at $\frac53\cdot5 = \frac{25}{3}$ ft/s, **independent of where the person is**.

### 4. Problems to Try

- **Ch. 10**: 7 (all parts: circle, and Spivak's related questions), 8 (annulus), 9 (particles on a line and a curve).
- Make up your own: a balloon (sphere) inflated at a constant volume rate; how fast does the radius change? (Answer: $r' = V'/(4\pi r^2)$, so it slows down as the balloon grows.)

### Conclusion

Related rates means differentiating an identity in $t$. Name the quantities as functions of time, write an equation true for all $t$, differentiate with the chain rule, and only then substitute the snapshot values. Most of the actual difficulty is finding the right geometric equation and eliminating quantities whose rates you don't know.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 16: The Chain Rule]]
- [[Calc I, Lecture 18: Implicit Differentiation]]
- [[Calc I, Lecture 24: Linear Approximation and Differentials]]
