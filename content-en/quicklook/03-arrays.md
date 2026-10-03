**In one line:** An array is a fixed-size heap object with O(1) access; know the `Arrays` utility, sorting internals, and the `asList`/covariance pitfalls.

- **Array:** it is an object, size is fixed, `arr.length` is a field; `b = a` shares the array, no copy.
- **Defaults:** numbers `0`, boolean `false`, objects `null`; in DP memos use `-1` or `Integer[]`.
- **2D:** array of arrays; `Arrays.fill(grid, new int[4])` makes all rows the same object.
- **Print/compare:** `Arrays.toString`/`equals`; use `deepToString`/`deepEquals` for 2D.
- **binarySearch:** needs a sorted array; not found returns `-(insertionPoint) - 1`.
- **Arrays.asList:** fixed-size view; `set` works, `add`/`remove` throw UOE; an `int[]` becomes one element.
- **Sort:** primitives use Dual-Pivot Quicksort (not stable); objects use TimSort (stable, takes a comparator).
- **Comparator:** `x - y` overflows; use `Integer.compare`.
- **Array vs ArrayList:** array holds primitives, less memory; ArrayList is dynamic but boxes.
- **Prefix sum:** use size `n + 1` so the `l = 0` edge case handles itself.
- **Covariance:** `String[]` is an `Object[]`, a wrong store throws `ArrayStoreException` at runtime; generics are invariant.

**Say in the interview:** "Objects use a stable TimSort because equal elements must keep order; primitives use quicksort for lower memory and better cache use."

**Avoid:** `list.remove(1)` removes an index, not a value; `binarySearch` on an unsorted array.
