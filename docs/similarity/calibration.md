# Similarity calibration

Written by `pnpm similarity --calibrate`; do not edit by hand.

A pair is flagged when its chamfer distance is at most 0.25 px on the 48 px normalised canvas.

| Group                          | Flagged            |
| ------------------------------ | ------------------ |
| Copies (must flag)             | 331 / 331 (100.0%) |
| Independent redesigns          | 49 / 213 (23.0%)   |
| Related sets (Lucide ~ Tabler) | 192 / 760 (25.3%)  |

### distance

| Group                          | Pairs | min   | p1    | p5    | p50   | p95   | p99   | max   |
| ------------------------------ | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Copies (must flag)             | 331   | 0.000 | 0.005 | 0.009 | 0.047 | 0.124 | 0.181 | 0.211 |
| Independent redesigns          | 213   | 0.000 | 0.000 | 0.110 | 0.739 | 3.651 | 6.654 | 6.658 |
| Related sets (Lucide ~ Tabler) | 760   | 0.000 | 0.000 | 0.054 | 0.694 | 3.656 | 6.717 | 8.195 |

### overlap

| Group                          | Pairs | min   | p1    | p5    | p50   | p95   | p99   | max   |
| ------------------------------ | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Copies (must flag)             | 331   | 0.848 | 0.868 | 0.894 | 0.967 | 0.994 | 0.997 | 1.000 |
| Independent redesigns          | 213   | 0.065 | 0.123 | 0.226 | 0.613 | 0.895 | 1.000 | 1.000 |
| Related sets (Lucide ~ Tabler) | 760   | 0.000 | 0.116 | 0.214 | 0.616 | 0.953 | 1.000 | 1.000 |

### cosine

| Group                          | Pairs | min   | p1    | p5    | p50   | p95   | p99   | max   |
| ------------------------------ | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Copies (must flag)             | 331   | 0.966 | 0.980 | 0.989 | 0.998 | 0.999 | 1.000 | 1.000 |
| Independent redesigns          | 213   | 0.102 | 0.209 | 0.347 | 0.777 | 0.994 | 1.000 | 1.000 |
| Related sets (Lucide ~ Tabler) | 760   | 0.000 | 0.176 | 0.327 | 0.783 | 0.994 | 1.000 | 1.000 |
