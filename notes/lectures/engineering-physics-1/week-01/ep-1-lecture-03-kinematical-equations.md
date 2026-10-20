---
id: L-0045
title: "Eng Phys I, Lecture 03: Solving the Kinematical Equations"
course: Engineering Physics I
lecture: 3
week: 1
date: 2026-10-19
tags: [physics, mechanics, engineering-physics-1]
source: "Daniel Kleppner and Robert Kolenkow, An Introduction to Mechanics (Cambridge, 2010), Ch. 1, Sec. 1.7 and Note 1.1"
summary: Getting velocity and position from acceleration by integration, the constant-acceleration formulas and when they fail, projectile motion, a nonuniform example (an electron in a radio wave), and measuring g.
---

Dynamics (next week) will hand us the **acceleration**. Getting velocity and position from it is **integration**: $\mathbf v(t) = \mathbf v_0 + \int_0^t\mathbf a\,dt'$, then $\mathbf r(t) = \mathbf r_0 + \int_0^t\mathbf v\,dt'$, plus **initial conditions**. For **constant** acceleration this gives the familiar $\mathbf r = \mathbf r_0 + \mathbf v_0t + \tfrac12\mathbf at^2$, which K&K warn **must not** be used when $\mathbf a$ varies. Here's how it works:

### 1. Integrating Acceleration

Chop $[t_0, t_1]$ into small steps $\Delta t$; over each, $\Delta\mathbf v \approx \mathbf a\,\Delta t$. Adding them up and letting $\Delta t \to 0$ turns the sum into an integral:
$$\mathbf v(t) = \mathbf v_0 + \int_{t_0}^{t}\mathbf a(t')\,dt', \qquad \mathbf r(t) = \mathbf r_0 + \int_{t_0}^{t}\mathbf v(t')\,dt'.$$

- It's done **componentwise**: three ordinary integrals.
- $t'$ is a **dummy variable** so that it doesn't clash with the upper limit $t$.
- **Initial conditions** $\mathbf r_0$, $\mathbf v_0$ are **needed**. Acceleration alone doesn't determine the motion: two integrations, two constants.

### 2. Constant Acceleration

With $\mathbf a$ constant and $t_0 = 0$:
$$\mathbf v = \mathbf v_0 + \mathbf at, \qquad \mathbf r = \mathbf r_0 + \mathbf v_0t + \tfrac12\mathbf at^2.$$
Eliminating $t$ (dot the first equation with itself): $v^2 = v_0^2 + 2\mathbf a\cdot(\mathbf r - \mathbf r_0)$. In 1D, $v^2 = v_0^2 + 2a(x - x_0)$.

> [!note] K&K's warning
> These are so familiar that people use them for varying acceleration. **Don't.** For a spring, drag or an orbit, go back to the integrals.

### 3. Projectile Motion (K&K Example 1.10)

Take $\mathbf a = -g\hat{\mathbf k}$, launch from the origin with $\mathbf v_0$ in the $xz$ plane:
$$x = v_{0x}t, \qquad z = v_{0z}t - \tfrac12gt^2.$$
Eliminating $t$:
$$z = \frac{v_{0z}}{v_{0x}}x - \frac{g}{2v_{0x}^2}x^2,$$
a **parabola**. With $v_{0x} = v_0\cos\theta$, $v_{0z} = v_0\sin\theta$:
- **time of flight** (back to $z = 0$): $T = \dfrac{2v_0\sin\theta}{g}$;
- **range**: $R = v_0\cos\theta\cdot T = \dfrac{v_0^2\sin2\theta}{g}$, maximized at $\theta = 45°$;
- **max height**: $h = \dfrac{v_0^2\sin^2\theta}{2g}$ (where $v_z = 0$).

**The big idea:** the horizontal and vertical motions are **independent**. Gravity only touches $z$.

### 4. Worked Examples

1. **Ping-pong ball on the moon** (Example 1.9): $\mathbf v_0 = (0, 5, -3)$ m/s and $\mathbf a = (0, 0, -2)$ m/s². After 5 s: $v_x = 0$, $v_y = 5$, $v_z = -3 + (-2)(5) = -13$, so $\mathbf v = (0, 5, -13)$ m/s.
2. **Nonuniform: an electron in a radio wave** (Example 1.11). An electric field $\mathbf E = \mathbf E_0\sin\omega t$ gives $a(t) = a_0\sin\omega t$ with $a_0 = -eE_0/m$. Starting from rest at the origin:
$$v(t) = \int_0^t a_0\sin\omega t'\,dt' = \frac{a_0}{\omega}(1 - \cos\omega t), \qquad x(t) = \frac{a_0}{\omega}t - \frac{a_0}{\omega^2}\sin\omega t.$$
   **Surprise**: besides jiggling, the electron **drifts** steadily at average speed $a_0/\omega$. The drift comes entirely from starting at rest at the moment the field was zero. Using $\tfrac12at^2$ here would be nonsense.
3. **Measuring $g$** (Problem 1.12): throw a ball up past two horizontal lines. If it spends total time $T_A$ above line A and $T_B$ above line B (height $h$ higher), then $g = \dfrac{8h}{T_A^2 - T_B^2}$. Proof: the time above a level is twice the time to fall from the top, $\tfrac T2 = \sqrt{2H/g}$, so the heights below the peak are $H = gT^2/8$; subtract.
4. **Ball thrown from a cliff**: $v_0 = 20$ m/s at $30°$ from a 45 m cliff ($g = 9.8$ m/s²). Then $v_{0z} = 10$, $v_{0x} = 17.3$ m/s. Solve $-45 = 10t - 4.9t^2$: $t = \frac{10 + \sqrt{100 + 882}}{9.8} = 4.22$ s. Lands $17.3\times4.22 \approx 73$ m out.

### 5. Math Note: Approximations (K&K Note 1.1)

K&K's Note 1.1 is a crash course in the approximations physicists use constantly:
- **Binomial**: $(1 + x)^n \approx 1 + nx$ for $|x| \ll 1$.
- **Taylor**: $f(x) \approx f(a) + f'(a)(x - a) + \tfrac12f''(a)(x - a)^2$; e.g. $\sin x \approx x$, $\cos x \approx 1 - x^2/2$, $e^x \approx 1 + x$.
- **Differentials**: $df = f'(x)\,dx$, the language for chopping things into small pieces when setting up integrals (mass elements, work elements, …).

### 6. Problems to Try

- **K&K Ch. 1**: 1.12 (measuring $g$), 1.13, 1.16, 1.21 (boy throwing a stone down a slope: maximum range on an incline).

### Conclusion

Kinematics in reverse is integration plus initial conditions. Constant acceleration gives the quadratic formulas and the parabolic trajectory, with horizontal and vertical motion decoupled. The radio-wave example shows that with time-varying acceleration you have to integrate honestly, and the answer can contain surprises like a steady drift.

## Related

- [[Eng Phys I, Lecture 02: Position, Velocity and Acceleration]]
- [[Eng Phys I, Lecture 04: Circular Motion and Rotating Vectors]]
- [[Eng Phys I, Lecture 06: Newton's Laws of Motion]]
