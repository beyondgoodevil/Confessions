---
id: L-0006
title: "Calc I, Lecture 02: Functions"
course: Calculus I
lecture: 2
week: 1
date: 2026-10-19
tags: [mathematics, calculus, calculus-1]
source: "Michael Spivak, Calculus, 3rd ed., Ch. 3 (Functions)"
summary: What a function is (first as a rule, then rigorously as a set of pairs), domains, the algebra of functions, and composition.
---

A **function** is first introduced as a *rule* assigning numbers to numbers, but the rigorous definition is that a function is a **collection of ordered pairs** in which no two pairs have the same first element. Along with the definition we need **domains**, the **algebra of functions** ($f+g$, $fg$, $f/g$) and, most importantly for calculus, **composition** $f \circ g$. Here's how it works:

### 1. The Provisional Definition

Spivak starts with: a function is a **rule which assigns, to each of certain real numbers, some other real number**. His examples are meant to stretch the word "rule":

- $f(x) = x^2$; a rational function like $h(c) = \dfrac{c^3 + 3c + 5}{c^2 - 1}$ for $c \ne \pm 1$.
- $s(x) = 1$ if $x$ rational, $0$ if irrational. **There's no formula, but it's a perfectly good function.**
- "the number of 7's in the decimal expansion of $x$". It's a legitimate function even though nobody can compute its value at $\pi$.

**Moral:** a function is *not* "something with a formula". This matters later, because the integral and the derivative are tools for building new functions that have no formula in older terms (e.g. $\log$ in Lecture 39).

> [!definition] Domain
> The **domain** of $f$ is the set of numbers to which $f$ applies. Convention: if a function is given by a formula and the domain isn't stated, it's **every number for which the formula makes sense**.

Example: $k(x) = 1/x + 1/(x - 1)$ has domain $\{x : x \ne 0, 1\}$.

### 2. The Real Definition

The problem with "rule" is that $f(x) = x^2$ and $f(x) = x^2 + 3x + 3 - 3(x + 1)$ are different *rules* but should be the *same function*. Spivak's fix is to ask what you need to know to know everything about $f$: just the value $f(x)$ for each $x$. So record the pairs.

> [!definition] Function (Spivak, Ch. 3)
> A **function** is a collection of pairs of numbers with the property that if $(a, b)$ and $(a, c)$ are both in the collection, then $b = c$.
> The **domain** of $f$ is the set of all $a$ for which some $(a, b)$ is in $f$, and that unique $b$ is written $f(a)$.

- $\{(1,7), (3,7), (5,3)\}$ **is** a function (two inputs can share an output).
- $\{(1,7), (1,8)\}$ is **not** a function ($f(1)$ would be ambiguous).
- Picture: this is exactly the **vertical line test** for graphs (Lecture 3).

### 3. Combining Functions

> [!definition] Sum, product, quotient
> $(f+g)(x) = f(x) + g(x)$, $(f\cdot g)(x) = f(x)g(x)$, $\left(\dfrac fg\right)(x) = \dfrac{f(x)}{g(x)}$.

**Domains:** $\operatorname{dom}(f+g) = \operatorname{dom}(f\cdot g) = \operatorname{dom} f \cap \operatorname{dom} g$, while
$$\operatorname{dom}(f/g) = \operatorname{dom} f \cap \operatorname{dom} g \cap \{x : g(x) \ne 0\}.$$

- Proving two functions equal = showing **same domain** and **same value at every point**. E.g. $(f+g)+h = f+(g+h)$ is just associativity of numbers applied pointwise.
- **Polynomial functions**: $f(x) = a_n x^n + \cdots + a_1 x + a_0$; the **degree** is the highest power with a nonzero coefficient. **Rational functions** are $p/q$ with $p, q$ polynomials.

### 4. Composition

> [!definition] Composition
> $(f \circ g)(x) = f(g(x))$, with domain $\{x : x \in \operatorname{dom} g \text{ and } g(x) \in \operatorname{dom} f\}$.

- **Order matters**: with $S(x) = x^2$, $\sin \circ S$ is $\sin(x^2)$ but $S \circ \sin$ is $\sin^2 x$. These are different functions!
- Composition **is associative**: $(f \circ g) \circ h = f \circ (g \circ h)$, so we write $f \circ g \circ h$.
- Spivak's point is that horrible-looking functions like $\sin^2(\sin(\sin^2(x \sin^2 x^2)))$ are built from just $I(x) = x$, $\sin$, and the operations $+, \cdot, /, \circ$. **That's why calculus can handle them**: once we know how derivatives interact with $+, \cdot, /, \circ$ (Lectures 14–16), we can differentiate anything built this way.

> [!note] Notation warning
> "The function $x^2$" is sloppy because it confuses a function with a number. Spivak tolerates "the function $f(x) = x^2$". The arrow notation $x \mapsto x^2$ is the honest version. It matters when there are two letters: $x \mapsto x + t^3$ and $t \mapsto x + t^3$ are different functions.

### 5. Worked Examples

1. **$f(x) = \dfrac{1}{1+x}$; find $f(f(x))$ and where it makes sense.** $f(f(x)) = \dfrac{1}{1 + \frac{1}{1+x}} = \dfrac{x+1}{x+2}$, valid for $x \ne -1$ (inner function defined) **and** $x \ne -2$ (outer function defined). Note that the simplified formula $\frac{x+1}{x+2}$ "forgets" the restriction $x \ne -1$.
2. **Domain of $\sqrt{1 - x^2}$**: need $1 - x^2 \ge 0$, so $[-1, 1]$.
3. **Write $\sin(x^2)$, $\sin^2 x$, $\sin(\sin x)$ using $S$, $\sin$, $\circ$**: $\sin \circ S$, $S \circ \sin$, $\sin \circ \sin$.
4. **Even/odd** (Problem 3-12): $f$ is **even** if $f(-x) = f(x)$ (e.g. $x^2$, $|x|$, $\cos$), **odd** if $f(-x) = -f(x)$ (e.g. $x^3$, $\sin$). Every $f$ on $\mathbb{R}$ is even + odd: $f(x) = \frac{f(x) + f(-x)}{2} + \frac{f(x) - f(-x)}{2}$ (Problem 3-13).

### 6. Problems to Try

- **Ch. 3**: 1 (composition practice), 3 (domains), 4 and 5 (building functions from $S$, $P$, $s$), 12 and 13 (even/odd), 21 (which "distributive laws" hold for $\circ$?).

### Conclusion

A function is just a set of pairs with no repeated first element: no formula is required, and the domain is part of the data. New functions are built with $+$, $\cdot$, $/$ and especially $\circ$, and the differentiation rules later in the course are exactly the rules for how derivatives pass through these operations.

## Related

- [[Calc I: Course Outline]]
- [[Calc I, Lecture 01: Real Numbers, Inequalities and Absolute Value]]
- [[Calc I, Lecture 03: Graphs and the Basic Functions]]
- [[Calc I, Lecture 16: The Chain Rule]]
