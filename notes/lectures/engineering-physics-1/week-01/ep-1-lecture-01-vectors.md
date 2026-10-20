---
id: L-0043
title: "Eng Phys I, Lecture 01: Vectors"
course: Engineering Physics I
lecture: 1
week: 1
date: 2026-10-19
tags: [physics, mechanics, engineering-physics-1]
source: "Daniel Kleppner and Robert Kolenkow, An Introduction to Mechanics (Cambridge, 2010), Ch. 1, Secs. 1.1-1.4"
summary: Vectors as directed line segments, vector algebra, the dot and cross products and what they mean physically, components and base vectors, and how to compute everything in coordinates.
---

Mechanics is written in **vectors**: quantities with both **magnitude and direction** (displacement, velocity, force). Vector notation compresses three component equations into one ($\mathbf F = m\mathbf a$ instead of $F_x = ma_x$, $F_y = ma_y$, $F_z = ma_z$). Today covers the **algebra** of vectors, the two kinds of product (**dot** gives a scalar, **cross** gives a vector), and doing it all in **components**. Here's how it works:

### 1. What a Vector Is

- **Geometrically**: a directed line segment, i.e. an arrow. Two vectors are **equal** if they have the same length and direction; **sliding an arrow parallel to itself doesn't change it**.
- **Magnitude**: $|\mathbf A|$ or just $A$.
- **Unit vector**: magnitude $1$. The unit vector along $\mathbf A$ is $\hat{\mathbf A} = \mathbf A / |\mathbf A|$, so $\mathbf A = |\mathbf A|\hat{\mathbf A}$ (size × direction).

**Algebra:**
- **Scalar multiple** $b\mathbf A$: parallel to $\mathbf A$ (antiparallel if $b < 0$), length $|b|A$.
- **Addition** (tip-to-tail): put the tail of $\mathbf B$ at the head of $\mathbf A$; $\mathbf A + \mathbf B$ runs from the tail of $\mathbf A$ to the head of $\mathbf B$.
- **Subtraction**: $\mathbf A - \mathbf B = \mathbf A + (-\mathbf B)$. Equivalently, put the vectors tail to tail; $\mathbf A - \mathbf B$ points from the head of $\mathbf B$ to the head of $\mathbf A$.
- Commutative, associative and distributive laws all hold, just like numbers.

### 2. The Dot (Scalar) Product

> [!definition] Dot product
> $\mathbf A\cdot\mathbf B = |\mathbf A||\mathbf B|\cos\theta$, where $\theta$ is the angle between them drawn tail to tail.

- $\mathbf A\cdot\mathbf B = A\times(\text{projection of }\mathbf B\text{ on }\mathbf A)$.
- $\mathbf A\cdot\mathbf B = 0$ with both nonzero ⇔ **perpendicular**. Unlike numbers, two nonzero vectors can have product $0$.
- $\mathbf A\cdot\mathbf A = A^2$.

**Law of cosines in one line** (K&K Example 1.1): with $\mathbf C = \mathbf A + \mathbf B$,
$$C^2 = \mathbf C\cdot\mathbf C = A^2 + B^2 + 2AB\cos\theta.$$
(The usual form, $C^2 = A^2 + B^2 - 2AB\cos\phi$, uses the interior angle $\phi = \pi - \theta$.)

**Physics (Example 1.2):** the **work** done by a constant force over a displacement $\mathbf d$ is $W = \mathbf F\cdot\mathbf d$. Only the force component **along** the motion does work. This is the whole basis of Chapter 4.

### 3. The Cross (Vector) Product

> [!definition] Cross product
> $\mathbf C = \mathbf A\times\mathbf B$ has magnitude $|\mathbf A||\mathbf B|\sin\theta$ ($0 \le \theta \le \pi$) and direction **perpendicular to both**, given by the **right-hand rule**: curl your fingers from $\mathbf A$ to $\mathbf B$, and your thumb points along $\mathbf C$.

- **Anticommutative**: $\mathbf B\times\mathbf A = -\mathbf A\times\mathbf B$. Order matters!
- $\mathbf A\times\mathbf A = 0$, and the product is $0$ whenever the vectors are parallel.
- K&K's warning: always use **right-handed** coordinates (and right-handed screws; hot-water faucets are among the few left-handed ones).

**Physics (Example 1.3):**
1. **Torque**: $\boldsymbol\tau = \mathbf r\times\mathbf F$. Only the force component **perpendicular** to the lever arm twists, which is why you push a wrench at the end and at right angles.
2. **Magnetic force**: $\mathbf F = q\mathbf v\times\mathbf B$. It's perpendicular to the velocity, so it can't change the speed.

**Area as a vector (Example 1.4):** the parallelogram with sides $\mathbf C$, $\mathbf D$ has area $|\mathbf C\times\mathbf D| = CD\sin\theta$, and the vector $\mathbf C\times\mathbf D$ is **normal** to the surface. This matters for flows through surfaces: water flowing parallel to a loop doesn't go through it.

### 4. Components and Base Vectors

Pick axes; the **components** $A_x, A_y, A_z$ are the projections onto them. With base (unit) vectors $\hat{\mathbf i}, \hat{\mathbf j}, \hat{\mathbf k}$:
$$\mathbf A = A_x\hat{\mathbf i} + A_y\hat{\mathbf j} + A_z\hat{\mathbf k}, \qquad |\mathbf A| = \sqrt{A_x^2 + A_y^2 + A_z^2}.$$

- **The vector doesn't depend on the axes; the components do.** The same arrow can be $(A, 0)$ in one system and $(0, -A)$ in a rotated one.
- One vector equation $\mathbf A = \mathbf B$ = **three** scalar equations.
- **Dot product in components** (using $\hat{\mathbf i}\cdot\hat{\mathbf i} = 1$, $\hat{\mathbf i}\cdot\hat{\mathbf j} = 0$, …):
$$\mathbf A\cdot\mathbf B = A_xB_x + A_yB_y + A_zB_z.$$
- **Cross product in components** (using $\hat{\mathbf i}\times\hat{\mathbf j} = \hat{\mathbf k}$, $\hat{\mathbf j}\times\hat{\mathbf k} = \hat{\mathbf i}$, $\hat{\mathbf k}\times\hat{\mathbf i} = \hat{\mathbf j}$):
$$\mathbf A\times\mathbf B = (A_yB_z - A_zB_y)\hat{\mathbf i} + (A_zB_x - A_xB_z)\hat{\mathbf j} + (A_xB_y - A_yB_x)\hat{\mathbf k} = \begin{vmatrix}\hat{\mathbf i} & \hat{\mathbf j} & \hat{\mathbf k}\\ A_x & A_y & A_z\\ B_x & B_y & B_z\end{vmatrix}.$$
Memory trick for the cyclic order: $i \to j \to k \to i$ gives a plus sign, backwards gives a minus.

### 5. Worked Examples

1. **K&K Example 1.5.** $\mathbf A = (3, 5, -7)$, $\mathbf B = (2, 7, 1)$.
   - $\mathbf A + \mathbf B = (5, 12, -6)$; $\mathbf A - \mathbf B = (1, -2, -8)$.
   - $|\mathbf A| = \sqrt{83} = 9.11$; $|\mathbf B| = \sqrt{54} = 7.35$.
   - $\mathbf A\cdot\mathbf B = 6 + 35 - 7 = 34$, so $\cos\theta = \frac{34}{(9.11)(7.35)} = 0.507$ and $\theta \approx 59.5°$.
   - $\mathbf A\times\mathbf B = \big(5\cdot1 - (-7)(7),\ (-7)(2) - 3\cdot1,\ 3\cdot7 - 5\cdot2\big) = (54, -17, 11)$. **Check**: $\mathbf A\cdot(\mathbf A\times\mathbf B) = 162 - 85 - 77 = 0$ ✓.
2. **A perpendicular unit vector (Example 1.6).** Find $\mathbf B$ in the $xy$ plane with $\mathbf B\perp(3, 5, 1)$ and $|\mathbf B| = 1$. $B_z = 0$ and $3B_x + 5B_y = 0$, so $B_y = -\tfrac35 B_x$. With $B_x^2 + B_y^2 = 1$: $B_x = \pm\frac{5}{\sqrt{34}} = \pm0.857$, $B_y = \mp0.514$.
3. **Torque on a wrench.** $\mathbf r = (0.25, 0, 0)$ m and $\mathbf F = (0, 40, 0)$ N give $\boldsymbol\tau = \mathbf r\times\mathbf F = (0, 0, 10)$ N·m: 10 N·m about the $+z$ axis, i.e. counterclockwise seen from above.
4. **Volume of a box** (Problem 1.9): $\mathbf A\cdot(\mathbf B\times\mathbf C)$ is the volume of the parallelepiped with edges $\mathbf A, \mathbf B, \mathbf C$, since $\mathbf B\times\mathbf C$ is the base area times the normal, and dotting with $\mathbf A$ picks out the height.

### 6. Problems to Try

- **K&K Ch. 1**: 1.1, 1.2 (vector algebra drills), 1.4 ($|\mathbf A - \mathbf B| = |\mathbf A + \mathbf B| \Rightarrow \mathbf A\perp\mathbf B$), 1.5, 1.6 (law of sines via the cross product), 1.7 ($\cos(\theta - \phi)$ by dot product), 1.8, 1.9, 1.11.

### Conclusion

A vector is an arrow, independent of any coordinate system. The **dot product** measures how much two vectors line up and gives scalars like work. The **cross product** measures how much they're perpendicular and gives oriented quantities like torque and area. Components turn all of this into arithmetic, and checking a cross product by dotting it with its factors is a cheap way to catch mistakes.

## Related

- [[Eng Phys I, Lecture 02: Position, Velocity and Acceleration]]
- [[Eng Phys I, Lecture 16: Work and the Work-Energy Theorem in One Dimension]]
- [[Eng Phys I, Lecture 25: Angular Momentum and Torque]]
