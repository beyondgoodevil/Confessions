---
id: M-0408
date: 2026-10-31
title: "Classical Mechanics: Newton, Lagrange, Hamilton and Noether"
tags: [physics, mathematics, mechanics, calculus-of-variations, differential-equations]
summary: "Classical mechanics in three formulations, following David Tong's article in the Princeton Companion to Applied Mathematics with Mark Dennis's article on invariants. Newton: the laws of motion, inertial frames and the Galilean group, the centre of mass, conservative forces and energy, the harmonic and damped oscillators, central forces and Kepler orbits, the Lorentz force, friction and drag. Lagrange: the principle of least action, the Euler-Lagrange equations, generalized coordinates, and centrifugal and Coriolis forces in a rotating frame. Noether: every continuous symmetry gives a conservation law, so momentum comes from the sameness of space and energy from the sameness of time. Hamilton: phase space and first-order equations, the bridge to quantum mechanics. Interactive graphs show damping, orbits and phase-space curves."
source: "Primary: none. Secondary: Nicholas J. Higham (ed.), The Princeton Companion to Applied Mathematics (Princeton University Press, 2015), IV.19 'Classical Mechanics' (David Tong) and II.21 'Invariants and Conservation Laws' (Mark R. Dennis). Worked examples and graph parameters are my own."
aliases: [Classical Mechanics, Lagrangian Mechanics, Hamiltonian Mechanics, Principle of Least Action, Euler-Lagrange Equations, Noether's Theorem, Damped Harmonic Oscillator, Kepler Problem, Laplace-Runge-Lenz Vector, Coriolis Force, Phase Space, Galilean Group]
---

David Tong opens his *Applied Companion* article with an ambitious line: the purpose of classical mechanics is "to predict the future and reconstruct the past". Galileo and Newton laid down the framework; Lagrange and Hamilton later recast it. The recasting rarely changes the answers, but it changes what one sees: it shows why energy and momentum are conserved, and it opens the door to quantum mechanics. This note follows Tong's article section by section and adds Mark Dennis's article on invariants, which develops Noether's theorem.

### 1. Newton's Laws and Inertial Frames

A particle is an object whose size does not matter, so its state at a moment is its position $\vb r(t) \in \R^3$. Newton's second law is

$$\dv{\vb p}{t} = \vb F(\vb r, \dot{\vb r}; t), \qquad \vb p = m\dot{\vb r},$$

and with constant mass it becomes $\vb F = m\vb a$. Because this is a second-order differential equation, a unique solution needs two initial conditions. A snapshot of positions is not enough to predict what happens next; one must also know the velocities.

**The first law is not a special case of the second.** Setting $\vb F = 0$ in the second law already gives straight-line motion. Tong's better reading of the first law is that *inertial frames exist*, frames in which free particles move uniformly. The second law then holds in those frames. There are infinitely many inertial frames, related by a 10-parameter family of transformations, the Galilean group:

| Transformation | Formula | Parameters |
|---|---|---|
| spatial translation | $\vb r' = \vb r + \vb c$ | 3 |
| rotation | $\vb r' = O\vb r$, $O^TO = I$ | 3 |
| boost | $\vb r' = \vb r + \vb ut$ | 3 |
| time translation | $t' = t + d$ | 1 |

Position, direction and velocity are relative. Acceleration is not: it makes sense to say simply that one is accelerating.

**Many particles.** For particles $i = 1, \ldots, N$, split the force on each into forces from the others and an external force, $\vb F_i = \sum_{j\ne i}\vb F_{ij} + \vb F_i^{\text{ext}}$. With total mass $M$ and centre of mass $\vb R = \sum_i m_i\vb r_i/M$,

$$M\ddot{\vb R} = \sum_{i<j}(\vb F_{ij} + \vb F_{ji}) + \sum_i \vb F_i^{\text{ext}}.$$

Newton's third law, $\vb F_{ij} = -\vb F_{ji}$, kills the first sum, leaving $M\ddot{\vb R} = \sum_i\vb F_i^{\text{ext}}$. The centre of mass moves as if all the mass were there. In Tong's example, a tennis ball and "a very lively cat" thrown the same way trace the same centre-of-mass path.

### 2. Conservative Forces, Energy and the Oscillator

A force is *conservative* if $\vb F = -\nabla V(\vb r)$ for some potential $V$. Gravity, electrostatics and interatomic forces are of this kind. For them the energy

$$E = \tfrac12 m\,\dot{\vb r}\cdot\dot{\vb r} + V(\vb r) = T + V$$

stays constant, since $\dv{E}{t} = (m\ddot{\vb r} + \nabla V)\cdot\dot{\vb r} = 0$ whenever the equation of motion holds.

**The harmonic oscillator.** A mass on a spring has $V = \tfrac12 kx^2$, force $F = -kx$ (Hooke's law), and equation $m\ddot x = -kx$, with solution

$$x = A\cos\omega_0 t + B\sin\omega_0 t, \qquad \omega_0 = \sqrt{k/m}.$$

Tong calls it "by far the most important system in all of theoretical physics". The reason is Taylor's theorem. A stable equilibrium is a minimum of $V$, where $V' = 0$. Near it, $V(x) \approx V(x_0) + \tfrac12V''(x_0)(x - x_0)^2$, so every small oscillation about a stable equilibrium is a harmonic oscillator.

**Damping.** Add linear drag $-\gamma\dot x$ (see section 4) to get $m\ddot x = -\gamma\dot x - kx$. Trying $x = e^{i\omega t}$ and writing $\beta = \gamma/2m$ gives three regimes:

| Regime | Condition | Solution |
|---|---|---|
| underdamped | $\omega_0^2 > \beta^2$ | $x = e^{-\beta t}(Ae^{i\omega t} + Be^{-i\omega t})$, $\omega = \sqrt{\omega_0^2 - \beta^2}$ |
| overdamped | $\omega_0^2 < \beta^2$ | $x = e^{-\beta t}(Ae^{\Omega t} + Be^{-\Omega t})$, $\Omega = \sqrt{\beta^2 - \omega_0^2}$ |
| critical | $\omega_0^2 = \beta^2$ | $x = (A + Bt)e^{-\beta t}$ |

In every case $x \to 0$: energy is not conserved. In the underdamped case the system oscillates more slowly than $\omega_0$, inside a decaying envelope. The graph uses $\omega_0 = 2$ and starts from $x = 1$ at rest; slide $\beta$ through 2 to pass from oscillation to critical damping and beyond.

```plot
x: 0, 10
y: -1.1, 1.1
slider: b = 0.3, 0.05..4, 0.07 | damping $\beta$
u(x) = exp(-b x) * (cos(sqrt(4 - b^2) x) + (b/sqrt(4 - b^2)) sin(sqrt(4 - b^2) x)) | underdamped, $\beta < 2$ | thick
o(x) = exp(-b x) * (cosh(sqrt(b^2 - 4) x) + (b/sqrt(b^2 - 4)) sinh(sqrt(b^2 - 4) x)) | overdamped, $\beta > 2$ | thick | orange
y = exp(-b x) | envelope $e^{-\beta t}$ | grey | dashed
y = -exp(-b x) | | grey | dashed
xlabel: $t$
caption: The damped oscillator with $\omega_0 = 2$, $x(0) = 1$, $\dot x(0) = 0$. Below $\beta = 2$ it oscillates inside the envelope; above, it creeps back without crossing zero.
```

### 3. Central Forces and the Planets

A central force has $V(\vb r) = V(r)$ with $r = |\vb r|$, so the force points along the radius. Besides energy, central forces conserve the angular momentum $\vb L = m\,\vb r\times\dot{\vb r}$. Differentiating, $\dot{\vb L} = \vb r\times\vb F = \boldsymbol\tau$, the torque, and a radial force has zero torque. Since $\vb L$ is fixed and always perpendicular to $\vb r$, the motion stays in one plane.

**Gravity.** A mass $m$ near a fixed mass $M$ has $V(r) = -GMm/r$, with $G \approx 6.67\times10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$. Tong solves the Kepler problem by a slick route instead of integrating Newton's equation. The inverse-square potential has an extra conserved quantity, the Laplace–Runge–Lenz vector

$$\vb e = \frac{\dot{\vb r}\times\vb L}{GMm} - \frac{\vb r}{r}.$$

With $\theta$ the angle from $\vb e$ to $\vb r$, its magnitude $e$ satisfies $er\cos\theta = L^2/GMm^2 - r$, that is,

$$r = \frac{L^2/GMm^2}{1 + e\cos\theta}.$$

This is a conic section with the origin at a focus: a circle for $e = 0$, an ellipse for $e < 1$, a hyperbola for $e > 1$. The ellipses close up, so a planet returns to the same point every orbit; orbits in other central potentials generally do not close. Most planets have $e < 0.1$. Mercury, closest to the sun, has $e \approx 0.2$; Halley's comet has $e \approx 0.97$. Slide $e$ to move from a circular orbit through Mercury's to Halley's.

```plot
x: -3.5, 1.5
y: -2, 2
equal: true
slider: e = 0.2, 0..0.97 | eccentricity $e$
curve: (cos(s)/(1 + e cos(s)), sin(s)/(1 + e cos(s))), s = 0..2pi | orbit, $r = \ell/(1 + e\cos\theta)$, $\ell = 1$ | thick
point: (0, 0) | sun at the focus
caption: Kepler orbits with semi-latus rectum $\ell = 1$. $e = 0$ is a circle, $e \approx 0.2$ is Mercury, $e \approx 0.97$ is Halley's comet.
```

With three bodies, no general solution is known, and the study of the three-body problem led, historically, to chaos theory.

### 4. Electromagnetism and Friction

**The Lorentz force.** A charge $q$ in electric and magnetic fields feels $\vb F = q(\vb E + \dot{\vb r}\times\vb B)$. A static electric field is $\vb E = -\nabla\phi$, so it gives a conservative force with $V = q\phi$. The field of a point charge $Q$ is $\vb E = Q\hat{\vb r}/(4\pi\epsilon_0 r^2)$. Coulomb's force is mathematically identical to Newton's gravity, both inverse-square, so the classical orbits of an electron about a proton are the same conic sections as the planets'.

A magnetic force is perpendicular to the velocity and does no work. In a constant field $\vb B = (0, 0, B)$, $m\ddot x = qB\dot y$, $m\ddot y = -qB\dot x$, and $\ddot z = 0$. The particle drifts along $\vb B$ and circles in the perpendicular plane at the cyclotron frequency $\omega = qB/m$. The period $2\pi/\omega$ does not depend on the speed: faster particles simply make bigger circles.

**Friction.** At bottom energy is always conserved, but in everyday life it leaks into the motion of atoms as heat. Friction is a single force that packages this ignorance.

- **Dry friction** opposes sliding with magnitude $\mu R$, where $R$ is the normal reaction. Tong gives $\mu \approx 0.6$ for steel on steel, $0.1$ with grease, and as low as $0.02$ for steel on ice.
- **Linear drag** $\vb F = -\gamma\vb v$ holds for slow motion in viscous fluids. For a sphere of radius $L$, Stokes's formula gives $\gamma = 6\pi\eta L$, with $\eta$ the viscosity.
- **Quadratic drag** $\vb F = -\gamma|\vb v|\vb v$ holds for fast objects in thin fluids, including anything falling through air; $\gamma$ is roughly proportional to the cross-section $L^2$.

Which regime applies is set by the Reynolds number $R = \rho vL/\eta$: linear drag when $R \ll 1$, quadratic when $R \gg 1$.

### 5. The Principle of Least Action

Lagrange's reformulation drops vectors in favour of any coordinates at all. Label the $3N$ coordinates of $N$ particles $x_a$; they define an $n$-dimensional configuration space, and the motion is a curve in it. Define the **Lagrangian**

$$L(x_a, \dot x_a) = T - V = \sum_a \tfrac12 m_a\dot x_a^2 - V(x_a),$$

with a minus sign between the energies. For each path between fixed endpoints, define the **action** $S = \int_{t_i}^{t_f} L\,dt$.

> [!theorem] Principle of least action
> The path actually taken is an extremum of $S$.

> [!proof]- Proof
> Vary the path, $x_a \to x_a + \delta x_a$, with $\delta x_a = 0$ at both ends. Then
> $$\delta S = \int_{t_i}^{t_f}\Bigl(\pdv{L}{x_a}\delta x_a + \pdv{L}{\dot x_a}\delta\dot x_a\Bigr)dt.$$
> Integrate the second term by parts. The boundary term vanishes because the ends are fixed, leaving
> $$\delta S = \int_{t_i}^{t_f}\Bigl(\pdv{L}{x_a} - \frac{d}{dt}\pdv{L}{\dot x_a}\Bigr)\delta x_a\,dt.$$
> This is zero for every variation exactly when the **Euler–Lagrange equations** hold:
> $$\pdv{L}{x_a} - \frac{d}{dt}\pdv{L}{\dot x_a} = 0.$$
> With $L = T - V$ these read $\partial L/\partial x_a = -\partial V/\partial x_a$ and $\partial L/\partial\dot x_a = p_a$, which is Newton's law $\dot p_a = -\partial V/\partial x_a$.

**Worked example (my own).** For the oscillator, $L = \tfrac12m\dot x^2 - \tfrac12kx^2$. Then $\partial L/\partial x = -kx$ and $\frac{d}{dt}(\partial L/\partial\dot x) = m\ddot x$, so the Euler–Lagrange equation is $m\ddot x = -kx$, as before.

The view is global: the whole path is judged at once, which can look teleological, yet it is equivalent to Newton's step-by-step law. The name is also slightly wrong. A fast, wiggly path makes $T$, and so $S$, as large as one likes, so the true path is never a maximum. It is a minimum or a saddle, and "principle of stationary action" would be more accurate. Tong stresses how far the idea reaches: all the fundamental laws of physics, from electromagnetism and general relativity to the standard model, can be written as action principles, and Feynman's path integral extends it to quantum mechanics, where the particle takes every path with a weight set by $S$.

### 6. Any Coordinates You Like: Rotating Frames

Newton's law holds only in inertial frames; the Euler–Lagrange equations hold in any coordinates $q_a$, even time-dependent ones:

$$\frac{d}{dt}\pdv{L}{\dot q_a} - \pdv{L}{q_a} = 0.$$

This follows from the chain rule, or more simply from the fact that "the path that makes $S$ stationary" says nothing about coordinates. The quantities $p_a = \partial L/\partial\dot q_a$ are the **generalized momenta**; they are the usual momenta only in Cartesian coordinates.

**Fictitious forces.** Take a free particle, $L = \tfrac12m\dot{\vb r}^2$, and describe it from a frame rotating with angular velocity $\boldsymbol\omega$ about the $z$-axis. Substituting the rotating coordinates gives $L = \tfrac12m(\dot{\vb r}' + \boldsymbol\omega\times\vb r')^2$, and the Euler–Lagrange equations become

$$m\bigl(\ddot{\vb r}' + \boldsymbol\omega\times(\boldsymbol\omega\times\vb r') + 2\boldsymbol\omega\times\dot{\vb r}'\bigr) = 0.$$

The particle no longer moves in a straight line. Two terms appear:

- **Centrifugal force**, $-m\boldsymbol\omega\times(\boldsymbol\omega\times\vb r')$, pointing outward with size $m\omega^2r_\perp$. It is what presses you to the side of a car taking a corner fast.
- **Coriolis force**, $-2m\boldsymbol\omega\times\dot{\vb r}'$. It has the same mathematical form as the magnetic part of the Lorentz force. It is too small to set the direction of water draining from a sink, despite the myth, but it organizes the circulation of the oceans and atmosphere.

They are called fictitious because they come from the frame, not from any interaction. Tong warns against dismissing them: in general relativity, gravity itself is a fictitious force of the same kind.

### 7. Noether's Theorem: Symmetry Gives Conservation

A symmetry is an invariance under a transformation. Emmy Noether's theorem ties each continuous symmetry to a conserved quantity.

> [!theorem] Noether's theorem
> Let $q_a \to Q_a(s, t)$ be a one-parameter family of transformations with $Q_a(0, t) = q_a(t)$, and suppose $L$ does not change: $\partial L/\partial s = 0$. Then
> $$\sum_a \pdv{L}{\dot q_a}\,\pdv{Q_a}{s}\Big|_{s=0}$$
> is constant in time along every solution of the equations of motion.

> [!proof]- Proof
> By the chain rule, $\partial L/\partial s = (\partial L/\partial Q_a)(\partial Q_a/\partial s) + (\partial L/\partial\dot Q_a)(\partial\dot Q_a/\partial s)$. At $s = 0$, use the Euler–Lagrange equation to replace $\partial L/\partial q_a$ by $\frac{d}{dt}(\partial L/\partial\dot q_a)$. The two terms then combine into a total derivative,
> $$0 = \pdv{L}{s}\Big|_{s=0} = \frac{d}{dt}\Bigl(\pdv{L}{\dot q_a}\pdv{Q_a}{s}\Big|_{s=0}\Bigr).$$

Tong notes that the proof is constructive: it tells you not only that something is conserved but what it is.

| Symmetry | Conserved quantity |
|---|---|
| space is the same everywhere (translation, $\vb r_i \to \vb r_i + s\vb n$) | total linear momentum $\sum_i\vb p_i$ |
| time is the same at every moment ($\partial L/\partial t = 0$) | energy $H = \sum_a\dot q_a\,\partial L/\partial\dot q_a - L$ |
| space is the same in every direction (rotation) | angular momentum |
| Galilean boosts | $t\sum_k m_k\dot{\vb r}_k - \sum_k m_k\vb r_k$, i.e. the centre of mass moves uniformly |

"Time is to energy what space is to momentum," as Tong puts it. Dennis adds an everyday case: a ball bouncing on a floor under gravity $V = mgz$. The potential does not depend on $x$ or $y$, so horizontal momentum is conserved even through the impulsive bounces; it does not depend on the angle about the vertical, so the vertical component of angular momentum is conserved, as in a frictionless spinning top. For gravity around a point mass, conservation of angular momentum is Kepler's second law.

A slightly wider class of symmetries is allowed: the Lagrangian may change by a total time derivative $d\Lambda/dt$, since that only adds a constant to the action and does not change the equations. Dennis also notes that the same theorem, applied to fields, gives continuity equations such as $\partial\rho/\partial t + \nabla\cdot\vb J = 0$, and that in quantum theory the freedom to change a wavefunction's overall phase gives the conservation of electric charge. In Tong's summary, suitably generalized, all conservation laws in nature come from symmetries this way.

### 8. Hamilton: Phase Space

Hamilton puts the coordinates $q_a$ and momenta $p_a = \partial L/\partial\dot q_a$ on an equal footing. Together they define a point in $2n$-dimensional **phase space**, and that point fixes the whole future. So paths in phase space never cross, and the motion is a flow. The **Hamiltonian** is the Legendre transform of the Lagrangian,

$$H(q_a, p_a; t) = \sum_a p_a\dot q_a - L,$$

with $\dot q_a$ rewritten in terms of $p_a$. Comparing the variation of $H$ with the Euler–Lagrange equations gives **Hamilton's equations**:

$$\dot q_a = \pdv{H}{p_a}, \qquad \dot p_a = -\pdv{H}{q_a}.$$

These replace $n$ second-order equations with $2n$ first-order ones, which suits initial-value problems.

**Examples.** For a particle in a potential, $H = \vb p\cdot\vb p/2m + V(\vb r)$, and Hamilton's equations are $\dot{\vb r} = \vb p/m$ and $\dot{\vb p} = -\nabla V$, the definition of momentum and Newton's law. For a charge in a magnetic field the momentum becomes $\vb p = m\dot{\vb r} + (q/c)\vb A$, which differs from the usual momentum by the vector potential, and $H = |\vb p - (q/c)\vb A|^2/2m + q\phi$.

For the oscillator, $H = p^2/2m + \tfrac12kx^2$. Each energy level $H = E$ is an ellipse in the $(x, p)$ plane, and the motion runs round it. The graph uses $m = k = 1$; slide $E$ to move between ellipses, and the dot shows the state at time $t$.

```plot
x: -3, 3
y: -3, 3
equal: true
slider: E = 1, 0.1..4 | energy $E$
slider: t = 0, 0..2pi | loop | time $t$
curve: (sqrt(2E) cos(s), sqrt(2E) sin(s)), s = 0..2pi | level set $H = E$ | thick
point: (sqrt(2E) cos(t), -sqrt(2E) sin(t)) | state $(x, p)$ at time $t$
xlabel: position $x$
ylabel: momentum $p$
caption: Phase space of the oscillator $H = \tfrac12p^2 + \tfrac12x^2$. Each energy is a closed curve; the state circles it clockwise.
```

Tong says the advantage of Hamilton's form is not practical but structural. It is a geometric formulation, naturally written in the language of symplectic geometry; it is the starting point for chaos theory and integrable systems; and above all it is the most direct link to quantum mechanics.

### 9. Beyond: Relativity

Dennis carries the story of invariance past Newton. Galilean relativity treats all inertial frames as equivalent, with the matrix boost $x' = x - vt$. Maxwell's equations and the wave equation instead single out a speed $c$ that all observers agree on, and that leads to Lorentz boosts with factor $\gamma = (1 - v^2/c^2)^{-1/2}$. Observers then disagree about energy and momentum separately but agree on $E^2 - |\vb p|^2c^2 = m^2c^4$, the rest mass; at rest this gives $E = mc^2$. Only the space-time interval $s^2 = |\vb r|^2 - c^2t^2$ is invariant. Minkowski space-time has ten symmetries, and Noether's theorem turns them into the conservation of energy, momentum, angular momentum and the relativistic version of the centre-of-mass quantity. Newton's mechanics returns in the limit $v \ll c$.

### Conclusion

Newton's law $\vb F = m\vb a$ predicts motion once the force and two initial conditions are given, and it holds in inertial frames related by the ten-parameter Galilean group. Conservative forces conserve energy; central forces also conserve angular momentum, and the inverse-square law adds the Runge–Lenz vector, which turns Kepler's orbits into conic sections. Lagrange replaces the force law by the demand that the action $\int (T - V)\,dt$ be stationary, which works in any coordinates and produces the centrifugal and Coriolis forces automatically. Noether's theorem explains the conservation laws: momentum because space is the same everywhere, energy because time is the same at every moment, angular momentum because no direction is special. Hamilton's phase space turns mechanics into the geometry of a flow and leads on to chaos and to quantum mechanics.

## Related

- [[The Exponential, Logarithm and Trigonometric Functions: Definitions and How Computers Evaluate Them]]
