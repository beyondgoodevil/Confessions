---
id: M-0381
date: 2026-10-20
title: "Beethoven's Fifth: A Symphony From Four Notes"
tags: [music, composers, musical-form]
summary: "How Beethoven builds a whole symphony out of a four-note motto. The opening (fermatas, the missing tonic, 'Fate knocks at the door' and why Schindler can't be trusted); the first movement as sonata form grown from one cell (horn call, fragmentation, the oboe cadenza, the coda as second development); the plan of the whole from C minor to C major (variations, the scherzo and its uncanny transition, trombones and piccolo in the finale, the scherzo's return); the scherzo's likeness to Mozart's G minor finale; how the work was heard (Hoffmann, a New York diarist, Ives, the V for Victory); and Adorno's argument that radio turns it into a set of quotations. With playable examples."
source: "Robert Greenberg, How to Listen to and Understand Great Music (The Teaching Company, 2006), Lectures 31–32; Joseph Kerman and Gary Tomlinson, Listen, 8th ed. (Bedford/St. Martin's, 2015), ch. 15 (pp. 208–13); Robert Philip, The Classical Music Lover's Companion to Orchestral Music (Yale, 2018), pp. 73–74; The Cambridge Companion to Beethoven, ed. Glenn Stanley (Cambridge, 2000): Cooper ch. 3, Kamien ch. 5, Marston ch. 6, Botstein ch. 10, Notley ch. 14, Burnham ch. 16; Theodor W. Adorno, 'The Radio Symphony' (1941), in Essays on Music, ed. Richard Leppert (California, 2002), pp. 251–70; music examples transcribed from the LilyPond examples in Wikipedia, 'Symphony No. 5 (Beethoven)', which also reports Nottebohm's sketchbook find; horn-call pitches from Botstein"
aliases: [Beethoven's Fifth, Beethoven Symphony No. 5, Symphony No. 5 in C minor, Fate Motif, Thus Fate Knocks at the Door, The Radio Symphony]
---

Beethoven's Fifth is built almost entirely out of **four notes**. A motto that is "almost nothing" (Philip) is turned into a whole first movement, comes back in every later movement, and drives a story from **C minor darkness to C major triumph**. Here's how it works, with the examples playable:

### 1. The Motto

> [!definition] Motto (motive)
> A short, recognisable musical idea, here **three quick repeated notes and a long one** (short-short-short-LONG), that a composer develops by changing its pitches, instruments, loudness and context while keeping its rhythm.

```abc
caption: The opening (Allegro con brio). Two statements of the motto, each held under a fermata.
instrument: strings
M:2/4
L:1/8
Q:1/2=108
K:Cm
!ff!z G G G | !fermata!E4 | z F F F | D4- | !fermata!D4 |]
```

- **It's ambiguous on purpose.** The opening never sounds the tonic C. Because of the rests and fermatas you can't even tell where the beat is. E. T. A. Hoffmann thought the listener assumes **E-flat major** until the bass finally plays C in bar 7 (Kamien).
- **The pauses mattered to Beethoven.** He lengthened the second fermata "during" the first performance, after the parts had already gone to the publisher (Cooper).
- **"Thus Fate knocks at the door."** That line comes from Anton Schindler, whom Philip calls Beethoven's "unreliable" pupil; Schindler is known for forgeries. Greenberg mentions that Beethoven once said the motto came from **birdsong**. Either way the name "Fate motive" stuck.
- **A modern coincidence.** Short-short-short-long is Morse code for **V**, so the motto was adopted as the symbol of Victory against the Nazis in the Second World War (Philip). Philip's point is that this isn't what makes the symphony powerful.

### 2. A Whole Movement From One Cell

The first movement is in **sonata form**, the standard Classical first-movement plan: an **exposition** with two key areas, a **development** that breaks the material up and moves through keys, a **recapitulation** that brings everything back in the home key, and here a huge **coda**. What's new is how much of it grows from the motto. Greenberg lists Beethoven's innovations: forms used only as far as they serve expression, **pervasive motivic development**, a continuous dramatic narrative, and **rhythm used as a narrative element on its own**, apart from pitch.

1. **Theme 1** is four sequences of the motto, and the bridge grows straight out of it.
2. **The horn call.** The second group is launched by the two horns, bars 59–62: three B-flats, then E-flat, F, and B-flat an octave lower (Botstein). It is the motto stretched out into a fanfare, and it introduces the lyrical second theme in E-flat major. Greenberg calls theme 2 a "fourth-generation descendent" of the motto, and Philip notes that even under it the motto keeps **hammering in the bass**.

```abc
caption: The horn call (bars 59–62), pitches as Botstein describes them: the motto's three short notes now open out into E-flat, F and B-flat.
instrument: horn
M:2/4
L:1/8
Q:1/2=108
K:Eb
!ff!z B B B | e4 | f4 | B,4 |]
```

3. **Development.** The motto is imitated and sequenced, then the horn call is taken apart. Kerman describes the **fragmentation**: its two middle notes are echoed between winds and strings, and then shrink to **one note**, building a hush before the recapitulation that becomes "almost unbearable."
4. **Recapitulation.** The third fermata of the opening is now filled by a short, free **oboe cadenza** (marked Adagio), the one moment of rest in the movement. The second theme comes back in **C major**, which is supposed to be the triumph, but it's too early: the coda turns back to minor (Kerman, Greenberg).
5. **Coda.** Greenberg calls it a **second development**. It even builds a "new-sounding theme" from the truncated horn call, and the movement ends with hammered cadences on the motto's rhythm.

Hoffmann noticed all this in 1810: Beethoven, he said, related "all secondary ideas and all transition passages" through the rhythm of that simple motto (quoted by Kamien).

### 3. From C Minor to C Major

The other three movements answer the first. Kerman's rule of thumb: whenever the **C minor** key returns it recalls the struggle, and whenever a loud theme arrives in **C major** it foretells the triumph.

1. **Andante con moto (A-flat major).** Double variations: two themes varied in turn. A warm, dance-like cello melody, and a second theme that suddenly swerves into **C major** with trumpets blazing, in a rhythm like a slowed-down motto (Philip). Each time it fades away; Beethoven isn't ready to resolve things yet.
2. **Scherzo (C minor).** In place of a minuet. It opens with a quiet, rising phrase in the cellos and basses...

```abc
caption: The scherzo's opening, cellos and basses (pianissimo).
instrument: cello
M:3/4
L:1/4
Q:3/4=96
K:Cm clef=bass
!pp!G,, | (C, E, G, | C2 E | D2 ^F,) | G,3- | G,3 |]
```

...and then the horns hammer out **the motto's rhythm in triple time**:

```abc
caption: The horn theme of the scherzo (bars 19–26): short-short-short-LONG again.
instrument: horn
M:3/4
L:1/4
Q:3/4=96
K:Cm
!ff!G G G | G3 | G G G | G3 | G G G | [EG]3 | ([GB] [FA]) [EG] | [B,F]3 |]
```

3. **The trio (C major)** is a scrambling, almost comic fugue starting in the basses. Greenberg: "C major is making fun of C minor."
4. **The transition.** When the scherzo returns it has been drained: pizzicato strings, a brittle oboe, everything stealthy. It doesn't end. It sinks to a held **A-flat chord** marked ppp while the **timpani tap out the motto**, then a huge crescendo bursts straight into the finale (Philip, Kerman).
5. **Finale (C major).** A march, with **three trombones, piccolo and contrabassoon** joining the orchestra for the first time in the symphony (Philip; Botstein traces the trombones and contrabassoon to Haydn's *The Seasons*). Even here the motto returns as scurrying four-note cells.
6. **The ghost of the scherzo.** Near the end of the development the C minor scherzo music returns quietly. Greenberg: it is "a quiet acknowledgment of what has been overcome." Then the recapitulation, and a coda that ends with **forty bars of nothing but tonic and dominant** chords.

- **Significance:** the third and fourth movements are **joined without a break**, and themes are shared across movements. Nineteenth-century listeners took this as proof that Beethoven had turned the multi-movement symphony into an **organic whole** (Botstein). Marston calls the Fifth the **locus classicus** of a minor-mode work closing in the major.

### 4. Mozart in the Scherzo?

Adorno points out the "striking similarity" between the scherzo of the Fifth and the finale of **Mozart's G minor Symphony** (No. 40). Play them one after the other:

```abc
caption: Mozart, Symphony No. 40, finale, opening (Allegro assai).
instrument: strings
M:2/2
L:1/4
Q:1/2=120
K:Gm
!p!D | (G) B d g | (b2 a) !f!^c/ |]
```

It's the same shape: a rising arpeggio from the fifth of the key up through the triad, then a step down and a leap to the leading note. Mozart's is in G minor, Beethoven's in C minor, so it's **the same figure a fifth lower**. Wikipedia reports that Gustav Nottebohm found bars of this Mozart finale **copied out by Beethoven in a sketchbook for the Fifth**, so the resemblance is probably not an accident. For Adorno it shows how general these triad-based themes are; what makes each one individual is a short, memorable rhythm.

### 5. How It Was Heard

- **Hoffmann (1810).** His review made the Fifth the founding text of Romantic music criticism. Music is "the most romantic of all arts", revealing "an unknown realm" separate from the sensual world. Haydn is childlike, Mozart leads into the realm of spirits, and Beethoven "sets in motion the machinery of awe, of fear, of terror, of pain" (quoted by Burnham). Burnham's point: Hoffmann taught people to hear Beethoven's teeming variety as grounded in a **hidden unity**, the way one senses the unity of creation.
- **A New York music lover.** Kerman quotes a diarist at the American premiere in 1841: the Fifth was "generally unintelligible to me, except the Andante." Three years later the same man couldn't imagine how he had missed it, calling it "the transcendent affair it is."
- **Ives.** Charles Ives heard the opening "oracle" as "the soul of humanity at the door of the divine mysteries", and put the motto at the centre of a theme in his *Concord Sonata* (Notley).
- **The Second World War.** Morse V (Philip).

### 6. Adorno: What Radio Does to the Fifth

In "The Radio Symphony" (1941) Adorno uses the first movement of the Fifth to argue that **broadcasting damages Beethoven more than Wagner**.

1. **Nothing becomes Everything.** The movement is a kind of "creation ex nihilo": a motif that is "actually nothing in itself" has to be **posited** with such force at the start that it becomes the substance of everything that follows. The motif is a "cell" that represents the whole even when it appears as "a mere monad."
2. **Radio compresses the dynamics.** 1940s radio squeezed the range from pianissimo to fortissimo into a medium band between piano and forte. Without that range, the motto's repetitions stop being a **process** and become mere ornament, "and the whole movement is on the verge of relapsing into time."
3. **Quotation listening.** Symphonic themes are like the quotable maxims in a play: general (built on the triad) but made precise by a short rhythm. Radio picks them out, so that it "has transformed Beethoven's Fifth Symphony into a set of quotations from theme songs." Like the elderly ladies who liked *Hamlet* except that it was full of quotations.
4. **Colour.** Heard on its own, as radio encourages, the oboe cadenza sounds "poor"; it only works against the austere background of the strings.

- **Significance:** for Adorno the Fifth's greatness is its **structure in time**, and anything that turns it into memorable moments destroys the very thing it is. The disco version and T-shirts Burnham mentions would have proved his point.

### 7. Story or Pure Music?

Greenberg treats the Fifth from two angles at once: as **absolute music** (motives and keys) and as **metaphorical drama** (darkness overcome). Philip hears "a spirit of endurance against the odds." My own view is that the two aren't really in competition. The "story" is made of musical facts: a motto that won't go away, a key that keeps returning, a major mode that arrives too early in the first movement and properly only in the last. You can follow the drama without any programme, which is probably why the Fifth became the model of what instrumental music could mean.

### Conclusion

The Fifth turns a four-note rhythm into a whole symphony. In the first movement the motto generates the themes, the bridge, the horn call, the fragmentation and the coda. Across the work it keeps returning, in the slow movement's trumpets, the scherzo's horns, the timpani of the transition and the finale's scurrying figures, while the key moves from C minor to a C major that arrives too soon in the first movement and finally wins in the last. Its reception, from Hoffmann's "machinery of awe" to Adorno's worry that radio turns it into quotations, follows from that same quality: maximum meaning built from almost nothing.

## Related

- [[Bach's Metaphysics of Music: Luther, Leibniz and Spinoza]]
- [[Enlightenment as Myth: Horkheimer, Adorno and Baudrillard]]
