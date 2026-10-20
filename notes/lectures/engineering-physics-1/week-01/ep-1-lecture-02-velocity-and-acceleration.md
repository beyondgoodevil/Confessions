---
id: L-0044
title: "Eng Phys I, Lecture 02: Position, Velocity and Acceleration"
course: Engineering Physics I
lecture: 2
week: 1
date: 2026-10-19
tags: [physics, mechanics, engineering-physics-1]
source: "Daniel Kleppner and Robert Kolenkow, An Introduction to Mechanics (Cambridge, 2010), Ch. 1, Secs. 1.5-1.6"
summary: The position vector and why it depends on the origin, displacement, velocity and acceleration as derivatives of vectors, velocity as tangent to the path, uniform circular motion, units and dimensional checks, and relative velocity.
---

**Kinematics** describes motion without asking what causes it. The particle's location is the **position vector** $\mathbf r(t)$; differentiating once gives the **velocity** $\mathbf v = d\mathbf r/dt$ (always **tangent** to the path) and again the **acceleration** $\mathbf a = d\mathbf v/dt$. In Cartesian coordinates this is just three ordinary calculus problems side by side. Here's how it works:

### 1. Position and Displacement

- **Position vector** $\mathbf r = x\hat{\mathbf i} + y\hat{\mathbf j} + z\hat{\mathbf k}$: from the origin to the particle. **It depends on the choice of origin**: if the primed origin sits at $\mathbf R$, then $\mathbf r' = \mathbf r - \mathbf R$.
- **Displacement** $\mathbf S = \mathbf r_2 - \mathbf r_1$ is a **true vector**, independent of origin: $\mathbf r_2' - \mathbf r_1' = (\mathbf r_2 - \mathbf R) - (\mathbf r_1 - \mathbf R) = \mathbf r_2 - \mathbf r_1$.

### 2. One Dimension (Review)

- **Average velocity**: $\bar v = \dfrac{x(t_2) - x(t_1)}{t_2 - t_1}$.
- **Instantaneous velocity**: $v = \lim_{\Delta t\to0}\dfrac{x(t + \Delta t) - x(t)}{\Delta t} = \dfrac{dx}{dt}$.
- **Acceleration**: $a = \dfrac{dv}{dt} = \dfrac{d^2x}{dt^2}$.
- **Speed** $= |v|$.

Notation: K&K switch to Newton's dot notation for time derivatives later ($\dot x = dx/dt$, $\ddot x = d^2x/dt^2$). I'll use both.

### 3. Several Dimensions

> [!definition] Velocity and acceleration
> $$\mathbf v = \lim_{\Delta t\to0}\frac{\mathbf r(t + \Delta t) - \mathbf r(t)}{\Delta t} = \frac{d\mathbf r}{dt}, \qquad \mathbf a = \frac{d\mathbf v}{dt} = \frac{d^2\mathbf r}{dt^2}.$$

In components (the Cartesian unit vectors are **fixed**, so they just ride along):
$$\mathbf v = \dot x\,\hat{\mathbf i} + \dot y\,\hat{\mathbf j} + \dot z\,\hat{\mathbf k}, \qquad \mathbf a = \ddot x\,\hat{\mathbf i} + \ddot y\,\hat{\mathbf j} + \ddot z\,\hat{\mathbf k}.$$

**$\mathbf v$ is tangent to the trajectory**: as $\Delta t \to 0$, the chord $\Delta\mathbf r$ lines up with the path, and $\Delta\mathbf r \approx \mathbf v\,\Delta t$.

> [!note] Coming back to bite us
> Dropping the unit vectors when differentiating only works because $\hat{\mathbf i}, \hat{\mathbf j}, \hat{\mathbf k}$ never change direction. In polar coordinates (Lecture 5) the unit vectors rotate, and differentiating them produces the centripetal and Coriolis terms.

### 4. Worked Examples

1. **Finding $\mathbf v$ from $\mathbf r$** (K&K Example 1.7): $\mathbf r = A\left(e^{\alpha t}\hat{\mathbf i} + e^{-\alpha t}\hat{\mathbf j}\right)$.
   - $\mathbf v = A\alpha\left(e^{\alpha t}\hat{\mathbf i} - e^{-\alpha t}\hat{\mathbf j}\right)$, $|\mathbf v| = A\alpha\sqrt{e^{2\alpha t} + e^{-2\alpha t}}$.
   - Trajectory: $xy = A^2$, a **hyperbola**. At $t = 0$, $\mathbf v = \alpha A(\hat{\mathbf i} - \hat{\mathbf j})$; as $t \to \infty$ the particle runs off along the $x$ axis with speed growing without bound.
2. **Uniform circular motion** (Example 1.8): $\mathbf r = r(\cos\omega t\,\hat{\mathbf i} + \sin\omega t\,\hat{\mathbf j})$ with $r, \omega$ constant.
   - $|\mathbf r| = r$: a circle, traversed counterclockwise with **period** $T = 2\pi/\omega$. $\omega$ is the **angular velocity** (rad/s).
   - $\mathbf v = r\omega(-\sin\omega t\,\hat{\mathbf i} + \cos\omega t\,\hat{\mathbf j})$. Then $\mathbf v\cdot\mathbf r = 0$, so $\mathbf v$ is tangent, and $|\mathbf v| = r\omega$.
   - $\mathbf a = -r\omega^2(\cos\omega t\,\hat{\mathbf i} + \sin\omega t\,\hat{\mathbf j}) = -\omega^2\mathbf r$: **centripetal acceleration**, pointing at the center, magnitude $r\omega^2 = v^2/r$.
   - **Key point**: constant speed does **not** mean zero acceleration. The velocity's **direction** is changing.
3. **Relative velocity** (Problem 1.15): if frame B's origin is at $\mathbf R(t)$ in frame A, then $\mathbf r_B = \mathbf r_A - \mathbf R$, so $\mathbf v_B = \mathbf v_A - d\mathbf R/dt$. E.g. rain falling straight down at 8 m/s looks, from a car doing 20 m/s, like it's coming at $\arctan(20/8) \approx 68°$ from vertical.
4. **Jerk** (Problem 1.18): $\dot{\mathbf a}$, the rate of change of acceleration. Engineers care because high jerk is what makes elevator and train rides uncomfortable.

### 5. Dimensions and Units

- The **dimension** of a quantity is its makeup in mass, length and time: velocity is $L/T$, acceleration is $L/T^2$. SI units: m/s and m/s².
- **Radians**: $\theta = s/r$ (arc over radius), so it's **dimensionless**; $2\pi$ rad $= 360°$. In $\sin\omega t$, $\omega t$ is in radians, so $\omega$ has units rad/s (dimension $1/T$).
- **Always check dimensions.** Arguments of $\sin$, $e^x$, $\log$ must be dimensionless: in $v = \alpha r e^{\alpha t}$, $\alpha$ must be 1/s. This catches a lot of algebra errors on exams.

### 6. Problems to Try

- **K&K Ch. 1**: 1.10 (point on the line between two positions), 1.13 (elevator and marble), 1.15 (relative velocity, including two particles on a circle), 1.16 (sports car accelerating and braking), 1.18 (jerk).

### Conclusion

Position depends on the origin, displacement doesn't. Velocity and acceleration are the first and second time derivatives of the position vector, componentwise in Cartesian coordinates, with velocity tangent to the path. Uniform circular motion is the key example of **acceleration without a change in speed**: $\mathbf a = -\omega^2\mathbf r$, magnitude $v^2/r$, pointing inward.

## Related

- [[Eng Phys I, Lecture 01: Vectors]]
- [[Eng Phys I, Lecture 03: Solving the Kinematical Equations]]
- [[Eng Phys I, Lecture 04: Circular Motion and Rotating Vectors]]
