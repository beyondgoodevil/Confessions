---
id: L-0002
title: Multiplication and inverse matrices
course: MIT 18.06 Linear Algebra
lecture: 3
lecturer: Gilbert Strang
institution: MIT OpenCourseWare
date: 2026-09-11
tags: [linear-algebra, mit-18-06]
summary: Four ways to read a matrix product, when a matrix has an inverse, and Gauss–Jordan.
---

## Four ways to multiply

For $A$ of size $m \times n$ and $B$ of size $n \times p$, the product $C = AB$ can be read as rows times columns, as combinations of columns, as combinations of rows, or as a sum of rank-one pieces:

$$
AB = \sum_{k=1}^{n} (\text{column } k \text{ of } A)(\text{row } k \text{ of } B).
$$

## Inverses

> [!definition] Inverse
> A square matrix $A$ is *invertible* if there is a matrix $A^{-1}$ with $A^{-1}A = I = AA^{-1}$.

> [!theorem]
> If there is a nonzero $x$ with $Ax = 0$, then $A$ has no inverse.

> [!proof]
> If $A^{-1}$ existed, then $x = A^{-1}Ax = A^{-1}0 = 0$, a contradiction.

## Gauss–Jordan

Row-reduce $[\,A \mid I\,]$ until the left block is $I$; the right block is then $A^{-1}$. This is the elimination from [[Elimination with matrices]] carried all the way up as well as down: if $EA = I$ then $E = A^{-1}$.

```python
import numpy as np
A = np.array([[1, 3], [2, 7]])
np.linalg.inv(A)   # array([[ 7., -3.], [-2.,  1.]])
```

> [!question] For later
> Why is Gauss–Jordan rarely used in practice to compute inverses?
