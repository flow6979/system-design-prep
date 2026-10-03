**Ek line:** Array heap pe fixed-size object hai (O(1) access); `Arrays` utility, sorting internals aur `asList`/covariance ke pitfalls pata hone chahiye.

- **Array:** object hai, size fixed, `arr.length` field hai; `b = a` copy nahi, same array share hota hai.
- **Defaults:** numbers `0`, boolean `false`, objects `null`; DP memo me `-1` ya `Integer[]` use karo.
- **2D:** array of arrays; `Arrays.fill(grid, new int[4])` sab rows same object banata hai.
- **Print/compare:** `Arrays.toString`/`equals`; 2D ke liye `deepToString`/`deepEquals`.
- **binarySearch:** sorted array chahiye; not found pe `-(insertionPoint) - 1`.
- **Arrays.asList:** fixed-size view; `set` chalta hai, `add`/`remove` UOE; `int[]` ek hi element ban jaata hai.
- **Sort:** primitives = Dual-Pivot Quicksort (not stable); objects = TimSort (stable, comparator le sakta hai).
- **Comparator:** `x - y` overflow karta hai; `Integer.compare` use karo.
- **Array vs ArrayList:** array primitives, kam memory; ArrayList dynamic, boxing.
- **Prefix sum:** size `n + 1` rakho to `l = 0` edge case khud handle ho jaata hai.
- **Covariance:** `String[]` is `Object[]`, galat store pe runtime `ArrayStoreException`; generics invariant.

**Interview me bolo:** "Objects ke liye TimSort stable hai kyunki equal elements ka order matter karta hai; primitives ke liye quicksort kam memory leta hai."

**Galti mat karna:** `list.remove(1)` index hata deta hai, value nahi; unsorted array pe `binarySearch` mat chalana.
