---
id: L-0001
title: Elimination with matrices
course: MIT 18.06 Linear Algebra
lecture: 2
lecturer: Gilbert Strang
institution: MIT OpenCourseWare
date: 2026-09-04
tags: [linear-algebra, mit-18-06]
summary: Gaussian elimination, pivots, and elimination steps written as matrix multiplications.
---

## Elimination

To solve $Ax = b$, subtract multiples of each row from the rows below it until $A$ becomes an upper-triangular $U$. The diagonal entries left behind are the **pivots**. If a pivot is zero, swap in a lower row; if no row works, the matrix is singular.

## Elimination as multiplication

Each step is a multiplication by an *elementary matrix*. Subtracting $3 \times$ row 1 from row 2 is

$$
E_{21} = \begin{bmatrix} 1 & 0 & 0 \\ -3 & 1 & 0 \\ 0 & 0 & 1 \end{bmatrix},
$$

and the whole process is $E_{32}E_{31}E_{21}A = U$.

> [!note] Why this matters
> Writing elimination as matrices is what makes the inverse in the next lecture fall out naturally.
