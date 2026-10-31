---
id: M-0409
date: 2026-10-31
title: "The Exponential, Logarithm and Trigonometric Functions: Definitions and How Computers Evaluate Them"
tags: [mathematics, calculus, analysis, complex-numbers, numerical-analysis]
summary: "Where exp, log, sin and cos come from and why they are defined the way they are. Powers are extended from whole numbers by keeping the rule that they turn addition into multiplication. The exponential has four equivalent definitions: e^x, the solution of f' = f, the power series, and the limit of compound interest. The compound-interest picture explains Euler's formula as many small rotations. The logarithm is the inverse, the integral of 1/x, or a series, and on the complex plane it has no single continuous value. Sine and cosine come from arc length on the circle, from power series and from y'' = -y, and they lead to Fourier series. The last part follows how a computer actually evaluates these functions: polynomial approximation, range reduction and Horner's rule. Interactive graphs show the convergence."
source: "Primary: none. Secondary: Timothy Gowers (ed.), The Princeton Companion to Mathematics (Princeton University Press, 2008), III.25 'The Exponential and Logarithmic Functions' and III.92 'Trigonometric Functions' (Ben Green); Nicholas J. Higham (ed.), The Princeton Companion to Applied Mathematics (Princeton University Press, 2015), VI.11 'Evaluating Elementary Functions' (Florent de Dinechin and Jean-Michel Muller). Worked numbers are my own, computed in double precision."
aliases: [Exponential Function, Logarithm, Natural Logarithm, Euler's Formula, Compound Interest Definition of e, Sine and Cosine Definitions, Range Reduction, Horner's Rule, Remez Algorithm, Elementary Functions]
---

The exponential, the logarithm, sine and cosine appear in almost every calculus and physics course. They are usually introduced with one definition each, and the other properties are then proved or taken on trust. The *Princeton Companion* articles take the opposite view: each function can be defined in several equivalent ways, and each definition explains something the others hide. This note collects those definitions and then follows the *Applied Companion*'s article on how a computer, which can only add and multiply, produces values of $e^x$ and $\sin x$.

### 1. Extending Powers: Keep the Rule

For a whole number $m$, $a^m$ means $m$ copies of $a$ multiplied together. The basic rule is

$$a^{m+n} = a^m a^n,$$

so exponentiation "turns addition into multiplication". To give $a^t$ a meaning for other $t$, we keep this rule at all costs. Write $f(t) = 2^t$. The conditions are the functional equation $f(t + u) = f(t)f(u)$ and the starting value $f(1) = 2$.

- **Zero.** $f(1) = f(1 + 0) = f(1)f(0)$, so $f(0) = 1$.
- **Fractions.** $f(\tfrac32)^2 = f(3) = 8$, so $f(\tfrac32) = \sqrt 8$ (choosing the positive root). In general $f(p/q)$ must be the $q$th root of $2^p$.
- **Irrationals.** The functional equation stops here. To define $2^{\sqrt 2}$ we need one more property, and either of two works: $f$ is increasing, or $f$ is continuous. If $f$ is increasing, then $1.4 < \sqrt 2 < 1.5$ forces $2^{1.4} < 2^{\sqrt2} < 2^{1.5}$. Squeezing $\sqrt 2$ between closer and closer fractions pins the value down.

So the definition of $a^t$ for real $t$ is not a convention chosen at random. It is the only choice that keeps the multiplication rule and is increasing (or continuous).

### 2. Four Definitions of the Exponential

The *Companion* treats having many equivalent definitions as the mark of an important concept. The exponential has at least four.

1. **A power of $e$.** $\exp(x) = e^x$ with $e = 2.7182818\ldots$. This is the most familiar, but it does not say why $e$ is special.
2. **A differential equation.** $\exp$ is the only function with $f' = f$ and $f(0) = 1$. Among the functions $a^x$, $e^x$ is the only one that is its own derivative.
3. **A power series.** $\exp(x) = 1 + x + \dfrac{x^2}{2!} + \dfrac{x^3}{3!} + \cdots$. Textbooks often start here. It is not obvious that this is "some number to the power $x$", which is why it is written $\exp(x)$. With some work one checks $\exp(x+y) = \exp(x)\exp(y)$, $\exp(0) = 1$ and $\exp' = \exp$.
4. **Compound interest.** $\exp(x) = \displaystyle\lim_{n\to\infty}\Bigl(1 + \frac{x}{n}\Bigr)^n$.

The fourth definition is the one the *Companion* says "comes much closer to telling us what it really means". Suppose you invest \$100 for ten years at a nominal 100% total. Paid once at the end, you get \$200. Paid as 10% each year, compounded, you get $100 \times 1.1^{10} \approx \$259.37$. Compounding more often helps, but less and less:

| Compounding over ten years | Growth factor |
|---|---|
| once | $2$ |
| yearly, $(1 + \tfrac1{10})^{10}$ | $2.5937$ |
| monthly, $(1 + \tfrac1{120})^{120}$ | $2.7070$ |
| daily, $(1 + \tfrac1{3650})^{3650}$ | $2.7179$ |
| a million times, $(1 + 10^{-6})^{10^6}$ | $2.7182805$ |

The factors approach $e$. Why the limit exists is subtle. For fixed power $m$, $(1 + \frac1n)^m \to 1$ as $n \to \infty$; for fixed $n$, $(1+\frac1n)^m \to \infty$ as $m \to \infty$. In $(1 + \frac1n)^n$ the growing power exactly balances the shrinking base. The slider below shows $(1 + x/n)^n$ closing in on $e^x$.

```plot
x: -3, 3
y: -0.5, 12
slider: n = 1, 1..60, 1 | $n$
f(x) = exp(x) | $e^x$ | thick
g(x) = (1 + x/n)^n | $(1 + x/n)^n$ | orange
point: (1, g(1)) | value at $x = 1$
caption: Compound interest converging to the exponential. Raise $n$ and watch the orange curve approach $e^x$.
```

**Why the rule holds.** From definition 4 the product $\exp(x)\exp(y)$ is the limit of

$$\Bigl(1 + \tfrac xn\Bigr)^n\Bigl(1 + \tfrac yn\Bigr)^n = \Bigl(1 + \tfrac{x+y}{n} + \tfrac{xy}{n^2}\Bigr)^n.$$

The extra $xy/n^2$ is too small to matter: its effect is at most a factor $(1 + xy/n^2)^n$, which tends to 1. So the limit is $\exp(x + y)$.

### 3. Euler's Formula as Many Small Rotations

The power series and the compound-interest limit both make sense for a complex number $z$. Putting $z = i\theta$ into the series and separating real and imaginary parts gives

$$e^{i\theta} = \Bigl(1 - \frac{\theta^2}{2!} + \frac{\theta^4}{4!} - \cdots\Bigr) + i\Bigl(\theta - \frac{\theta^3}{3!} + \frac{\theta^5}{5!} - \cdots\Bigr) = \cos\theta + i\sin\theta.$$

With $\theta = \pi$ this is $e^{i\pi} = -1$. The *Companion* asks for a reason, not just a calculation, and finds one in compound interest. Why should $(1 + i\pi/n)^n$ be close to $-1$?

- The number $1 + i\pi/n$ sits just above 1 on the vertical line $x = 1$, which is tangent to the unit circle.
- So it is very nearly the point on the circle at angle $\pi/n$: for a tiny angle the arc is almost straight.
- Multiplying by it is therefore almost a rotation by $\pi/n$.
- Doing this $n$ times rotates by $\pi$, which is multiplication by $-1$.

The same argument gives $e^{i\theta} = \cos\theta + i\sin\theta$ for any $\theta$. It also explains $\exp' = \exp$: for small $w$, $(1 + w/n)^n$ is close to $1 + w$ because "if the total amount of interest is very small, then the interest on the interest is negligible". Hence $(\exp(w) - 1)/w \to 1$ as $w \to 0$.

```plot
x: -1.6, 1.6
y: -1.3, 1.3
equal: true
slider: t = 0.8, 0..2pi | $\theta$
curve: (cos(s), sin(s)), s = 0..2pi | unit circle | grey
point: (cos(t), sin(t)) | $e^{i\theta} = (\cos\theta, \sin\theta)$
vector: (0, 0), (cos(t), sin(t)) | | blue
y = 0 | | hidden
caption: $e^{i\theta}$ is the point at arc length $\theta$ around the unit circle. Set $\theta = \pi$ to reach $-1$.
```

The exponential can be extended further still. Anything with addition, multiplication and limits will do, so $\exp$ of a matrix or of an element of a Banach algebra makes sense through the power series.

### 4. The Logarithm

The natural logarithm also has three standard definitions.

1. **The inverse of exp.** For $t > 0$, $u = \log t$ means $t = e^u$.
2. **An integral.** $\log t = \displaystyle\int_1^t \frac{dx}{x}$.
3. **A series.** $\log(1 + x) = x - \tfrac12x^2 + \tfrac13x^3 - \cdots$ for $|x| < 1$. This covers $0 < t < 2$; for $t \ge 2$ use $\log t = -\log(1/t)$.

```plot
x: 0, 5
y: -1.5, 3
slider: t = 2, 0.2..5 | $t$
f(x) = 1/x | $1/x$
g(x) = ln(x) | $\log x$ | orange
area: f(x), 1..t
point: (t, g(t)) | $(t, \log t)$
caption: The shaded area under $1/x$ from 1 to $t$ equals $\log t$. For $t < 1$ the area counts as negative.
```

The key property reverses the exponential's: $\log(st) = \log s + \log t$, so log turns multiplication into addition. The proof from definition 1 is two lines: write $s = e^a$, $t = e^b$; then $st = e^{a+b}$ and $\log(st) = a + b$. In the language of group theory, $\exp$ is an isomorphism from the real numbers under addition to the positive reals under multiplication, and $\log$ is its inverse. The two groups have the same structure.

**The complex logarithm.** Here the two functions part company. Every nonzero $z$ is $re^{i\theta}$, so one wants $\log z = \log r + i\theta$. But $\theta$ is only fixed up to multiples of $2\pi$: $1 = e^{0} = e^{2\pi i}$, so $\log 1$ could be $0$ or $2\pi i$. No choice gives a continuous logarithm on the whole punctured plane. If we insist $0 \le \theta < 2\pi$, the logarithm jumps by $2\pi i$ as $z$ crosses the positive real axis. The *Companion* calls this "an entirely positive phenomenon". The jump is what lies behind Cauchy's residue theorem in complex analysis.

### 5. Sine and Cosine

**From the circle.** Measure angles in radians: the angle $AOB$ is $\theta$ when the arc from $A = (1,0)$ to $B$ on the unit circle has length $\theta$. Then $\sin\theta$ is the $y$-coordinate of $B$, with its sign, and the function is extended to all of $\mathbb R$ by making it periodic with period $2\pi$.

This raises a question the *Companion* takes seriously: what is the length of a curved arc? The only satisfactory answer is calculus. The arc length of the unit circle from $(1, 0)$ up to height $\sin\theta$ is $\int \sqrt{1 + (dx/dy)^2}\,dy$, and on the circle $1 + (dx/dy)^2 = 1/(1 - y^2)$. So for $0 \le \theta \le \pi/2$,

$$\theta = \int_0^{\sin\theta} \frac{dy}{\sqrt{1 - y^2}}.$$

This defines $\sin$ precisely, if implicitly: it is the inverse of the function $\int_0^s dy/\sqrt{1-y^2}$, which is $\arcsin s$.

**From power series.**

$$\sin z = z - \frac{z^3}{3!} + \frac{z^5}{5!} - \cdots, \qquad \cos z = 1 - \frac{z^2}{2!} + \frac{z^4}{4!} - \cdots.$$

These converge for every real or complex $z$, so they make $\sin$ and $\cos$ functions on the whole complex plane. Differentiating term by term (which can be justified) gives $\sin' = \cos$, $\cos' = -\sin$, and so $\sin'' = -\sin$.

**From a differential equation.** $\sin$ is the unique solution of $y'' = -y$ with $y(0) = 0$ and $y'(0) = 1$. This is the cleanest way to prove that the circle definition and the series definition agree. Show that each satisfies the same equation and initial conditions, and uniqueness does the rest. The same equation is the harmonic oscillator of physics, which is why sines describe springs, pendulums and waves.

The graph shows the Taylor polynomials of $\sin x$ hugging the curve over a wider and wider range.

```plot
x: -7, 7
y: -3, 3
xstep: pi/2
f(x) = sin(x) | $\sin x$ | thick
p1(x) = x | degree 1 | grey | dashed
p3(x) = x - x^3/6 | degree 3 | green
p5(x) = p3(x) + x^5/120 | degree 5 | orange
p7(x) = p5(x) - x^7/5040 | degree 7 | purple
p9(x) = p7(x) + x^9/362880 | degree 9 | red
caption: Taylor polynomials of $\sin x$ about 0. Each added term extends the range where the approximation is good.
```

**Toward Fourier series.** Comparing the series for $e^{z}$, $\sin z$ and $\cos z$ gives Euler's formula again. The functions $e^{in\theta}$ are homomorphisms from the circle group $\mathbb R/2\pi\mathbb Z$ into the unit circle, which makes them the natural building blocks for the Fourier analysis of periodic functions. In real form, a smooth $2\pi$-periodic $f$ can be written

$$f(x) = a_0 + a_1\cos x + b_1\sin x + a_2\cos 2x + b_2\sin 2x + \cdots.$$

The coefficients are recovered by orthogonality. For $n, m \ge 1$,

$$\frac1\pi\int_0^{2\pi}\cos nx\cos mx\,dx = \begin{cases}1 & n = m\\ 0 & n \ne m\end{cases}, \qquad \int_0^{2\pi}\cos nx\sin mx\,dx = 0,$$

so $a_n = \frac1\pi\int_0^{2\pi} f(x)\cos nx\,dx$. Ben Green notes that such decompositions "ultimately underlie devices like compact disk players and mobile phones". He ends with one geometric gem: a triangle inscribed in a unit circle, with angles $A$, $B$, $C$, has area exactly $2\sin A\sin B\sin C$.

### 6. How a Computer Computes $e^x$ and $\sin x$

A chip can add, subtract and compare cheaply, and multiply at a higher cost. The only functions of one variable built from these operations are piecewise polynomials. Every value of $e^x$ or $\sin x$ that a computer prints comes from a polynomial (or, if division is allowed, a rational function), plus tables stored in memory. The *Applied Companion* article by de Dinechin and Muller describes three steps.

**Step 1: choose a polynomial.** Take $e^x$ on $[0, 1]$ with degree 5. The obvious choice is the Taylor polynomial

$$p(x) = 1 + x + \frac{x^2}{2} + \frac{x^3}{6} + \frac{x^4}{24} + \frac{x^5}{120}.$$

But Taylor approximation is local. It is excellent near 0 and worst at the far end; on $[0,1]$ its largest error is about $1.6 \times 10^{-3}$, at $x = 1$.

```plot
x: 0, 1
y: -0.0002, 0.0018
p(x) = 1 + x + x^2/2 + x^3/6 + x^4/24 + x^5/120
e(x) = exp(x) - p(x) | error $e^x - p(x)$ | red | thick
caption: Error of the degree-5 Taylor polynomial for $e^x$ on $[0, 1]$. It is tiny near 0 and grows toward 1.
```

The best polynomial spreads the error evenly. The Remez algorithm finds the polynomial that minimizes the *maximum* error over the interval. Its error oscillates, reaching its largest size at several points with alternating signs. For $e^x$ on $[0,1]$ at degree 5, its error is about $5 \times 10^{-6}$, roughly three hundred times better than Taylor. One complication: the coefficients must themselves be stored as machine numbers, and rounding them spoils the even spread. Modern tools such as Sollya search directly for the best polynomial with machine-representable coefficients.

The article's table shows the trade-off. The maximum error of the approximation falls with the degree and rises with the interval size:

| Degree | $[0, 1]$ | $[0, \tfrac12]$ | $[0, \tfrac14]$ |
|---|---|---|---|
| 2 | $1.41\times10^{-2}$ | $1.08\times10^{-3}$ | $1.07\times10^{-4}$ |
| 3 | $8.76\times10^{-4}$ | $3.40\times10^{-5}$ | $1.90\times10^{-6}$ |
| 4 | $5.07\times10^{-5}$ | $8.33\times10^{-7}$ | $4.57\times10^{-8}$ |
| 5 | $4.86\times10^{-6}$ | $5.27\times10^{-8}$ | $1.94\times10^{-9}$ |

High degree costs time and can add rounding error. So the second step shrinks the interval instead.

**Step 2: range reduction.** Use an identity of the function to move the input into a small interval. For $e^x$ the identity is $e^{a+b} = e^a e^b$. Split the binary digits of $x$ into the first $k$ bits, $a$, and the rest, $b$. Look up $e^a$ in a table of $2^k$ precomputed values (typically $k \le 8$). Since $b \in [0, 2^{-k}]$, $e^b$ needs only a low-degree polynomial. One multiplication rebuilds the answer.

Worked example (my own, with $k = 3$). For $x = 0.7$, the first three binary digits give $a = 0.101_2 = 0.625$, leaving $b = 0.075$.

- Table: $e^{0.625} = 1.8682460$.
- A cubic is enough for the small part: $1 + b + b^2/2 + b^3/6 = 1.0778828$, against the true $e^{0.075} = 1.0778842$, an error of $1.3 \times 10^{-6}$.
- Product: $1.8682460 \times 1.0778842 = 2.0137527$, which is $e^{0.7}$.

For $\sin$ and $\cos$, range reduction uses periodicity: find an integer $n$ and a small $y$ with $y \approx x - n\pi/2$. The article warns that this step "should not be overlooked". For a huge argument like $x = 10^{22}$, subtracting multiples of a rounded $\pi/2$ loses every correct digit, because the rounding error in $\pi/2$ is multiplied by about $10^{22}$. The correct value is $\sin(10^{22}) \approx -0.8522$, and getting it needs the Payne–Hanek method, which stores $2/\pi$ to many more bits than a normal number has.

**Step 3: evaluate the polynomial.** Horner's form

$$p(x) = a_0 + x\bigl(a_1 + x(a_2 + x(a_3 + x(a_4 + xa_5)))\bigr)$$

uses the fewest multiplications, but each step waits for the one before. Modern processors can do several operations at once, so one may split the polynomial into even and odd parts,

$$p(x) = \bigl(a_0 + a_2x^2 + a_4x^4\bigr) + x\bigl(a_1 + a_3x^2 + a_5x^4\bigr) = p_e(x^2) + x\,p_o(x^2),$$

at the cost of one extra multiplication, and evaluate the two halves in parallel. Function-specific tricks help too: the sine series has only odd powers. For numbers with thousands of digits, entirely different algorithms are used, based for instance on the arithmetic–geometric mean.

### Conclusion

The *Companion* articles agree on one theme: the elementary functions are not defined once and for all but meet at the crossing of several definitions. The exponential is a power of $e$, the solution of $f' = f$, a power series and a compound-interest limit; the last makes both $e^x e^y = e^{x+y}$ and Euler's formula intuitive. The logarithm reverses the exponential, is the area under $1/x$, and on the complex plane cannot be made continuous, which turns out to be useful. Sine and cosine come from arc length, from power series and from the oscillator equation $y'' = -y$, and they are the raw material of Fourier analysis. A computer meets all of these through polynomials only. It picks the polynomial with the smallest worst-case error, shrinks the input with an identity such as $e^{a+b} = e^ae^b$ or periodicity, and evaluates the result with Horner's rule.

## Related

- [[Classical Mechanics: Newton, Lagrange, Hamilton and Noether]]
