# Benchmark Results

Execution times (in milliseconds) for image comparison packages across test cases.  
All values represent raw performance metrics (average, p50, p99).

---

## Case: web avg diff (672x623)
| Package      | Avg (ms) | p50 (ms) | p99 (ms) |
|--------------|----------|----------|----------|
| looks-same   | 39.77    | 37.08    | 54.56    |
| pixelmatch   | 52.35    | 52       | 57.24    |
| resemblejs   | 36.13    | 35.29    | 47.35    |
| blink-diff   | 60.9     | 61.08    | 62.84    |

## Case: web avg success (656x547)
| Package      | Avg (ms) | p50 (ms) | p99 (ms) |
|--------------|----------|----------|----------|
| looks-same   | 18.37    | 17.65    | 24.26    |
| pixelmatch   | 39.8     | 39.52    | 43.41    |
| resemblejs   | 22.93    | 22.25    | 31.64    |
| blink-diff   | 37.37    | 38.95    | 42.37    |

## Case: equal images (1000x1000)
| Package      | Avg (ms) | p50 (ms) | p99 (ms) |
|--------------|----------|----------|----------|
| looks-same   | 0.04     | 0.03     | 0.07     |
| pixelmatch   | 31.03    | 30.93    | 32.64    |
| resemblejs   | 55.31    | 55.1     | 58.73    |
| blink-diff   | 90.6     | 89.36    | 98.84    |

## Case: 1% visible diff (1000x1000)
| Package      | Avg (ms) | p50 (ms) | p99 (ms) |
|--------------|----------|----------|----------|
| looks-same   | 45.09    | 43.44    | 54.91    |
| pixelmatch   | 107.8    | 108.1    | 110.28   |
| resemblejs   | 57.09    | 56.6     | 66.89    |
| blink-diff   | 95.52    | 94.52    | 106.12   |

## Case: 10% visible diff (1000x1000)
| Package      | Avg (ms) | p50 (ms) | p99 (ms) |
|--------------|----------|----------|----------|
| looks-same   | 48.61    | 48.52    | 50.66    |
| pixelmatch   | 108.62   | 108.46   | 112.82   |
| resemblejs   | 56.2     | 56.13    | 60.98    |
| blink-diff   | 95.65    | 94.45    | 104.43   |

## Case: full max diff (1000x1000)
| Package      | Avg (ms) | p50 (ms) | p99 (ms) |
|--------------|----------|----------|----------|
| looks-same   | 138.09   | 130.43   | 154.69   |
| pixelmatch   | 158.36   | 157.83   | 165.5    |
| resemblejs   | 446.21   | 445.17   | 459.8    |
| blink-diff   | 672.47   | 667.98   | 749.87   |

## Case: demonstrative example visible 8% diff (896×784)
| Package      | Avg (ms) | p50 (ms) | p99 (ms) |
|--------------|----------|----------|----------|
| looks-same   | 36.96    | 36.97    | 38.59    |
| pixelmatch   | 98.18    | 98.04    | 101.33   |
| resemblejs   | 61.67    | 61.36    | 68.36    |
| blink-diff   | 118.86   | 117.07   | 132.47   |
