Here's an explanation of the `handleScroll` function and its role in implementing infinite scroll pagination:

```typescript
const handleScroll = () => {
  // 1. Guard clauses to prevent unnecessary checks
  if (!containerRef.current || loading || error) return;

  // 2. Get scroll position measurements
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

  // 3. Calculate if user is near bottom (with 500px threshold)
  const isNearBottom = scrollTop + clientHeight >= scrollHeight - 500;

  // 4. Conditions to trigger loading more content
  if (isNearBottom && hasMore && !isFetchingMore) {
    loadMoreStories();
  }
};
```

**Breakdown of how it works:**

1. **Guard Clauses:**

   - `!containerRef.current`: Checks if the container element exists
   - `loading`: Prevents actions during initial load
   - `error`: Stops loading more if there's an active error

2. **Scroll Measurements:**

   - `scrollTop`: How far the user has scrolled from the top (px)
   - `scrollHeight`: Total height of the scrollable content (px)
   - `clientHeight`: Visible viewport height (px)

3. **Bottom Detection Logic:**

   ```ts
   scrollTop + clientHeight >= scrollHeight - 500;
   ```

   - Triggers when user is within 500px of the bottom
   - The 500px buffer prevents waiting until exact bottom
   - Adjust this number to change "load more" sensitivity

4. **Loading Conditions:**
   - `hasMore`: Only trigger if there's more data available
   - `!isFetchingMore`: Prevent duplicate requests
   - Calls `loadMoreStories()` when all conditions met

**Important Implementation Notes:**

- **Event Listener Management:**

  ```tsx
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, isFetchingMore, loading, error]);
  ```

  - Added to window's scroll event
  - Cleanup function removes listener on unmount
  - Dependency array ensures latest state values

- **Performance Considerations:**
  - The scroll event fires frequently, so the handler is designed to be lightweight
  - All checks are simple number comparisons
  - No expensive DOM operations
  - Optional: Could add throttling with `requestAnimationFrame`

**Visual Representation of Scroll Calculation:**

```bash
┌───────────────────────────────────────────────┐
│                  Viewport                     │▲ ▲
│                                               ││ │scrollTop (distance scrolled from top)
│                                               ││ ▼
│   ┌───────────────────────────────────────┐   ││ ▲
│   │          Currently Visible            │   │  │
│   │               Content                 │   │  │
│   │                                       │   │
│   │                                       │   │
│   │                                       │   │  clientHeight (visible area)
│   │                                       │   │
│   │                                       │   │
│   │                                       │   │  │
│   │                                       │   │  │
│   └───────────────────────────────────────┘   │  ▼
│                                               │
├───────────────────────────────────────────────┤
│                                               │ scrollHeight (total content height)
│                Hidden Content                 │
│                                               │
│                                               │
│                                               │
│       ▲                                       ││
│       │ 500px threshold                       ││
│       ▼                                       ││
├───────────────────────────────────────────────┤▼
│                                               │
│                More Content                   │
│                                               │
└───────────────────────────────────────────────┘

[ scrollTop + clientHeight ]        [ scrollHeight - 500px ]
       ▼                                     ▼
┌───────────────┐                 ┌─────────────────────────┐
│ Current       │                 │ Load More Content When  │
│ Scroll        │─────────────────│ These Points Intersect  │
│ Position      │                 │                         │
└───────────────┘                 └─────────────────────────┘
```

When the sum of `scrollTop + clientHeight` approaches `scrollHeight`, we trigger loading of more content.

**Why 500px Threshold?**

- Gives time to load content before user reaches bottom
- Prevents UI "hanging" at bottom
- Can be adjusted based on content size and network speed
- Typical values range between 200-1000px

This pattern provides smooth infinite scrolling while maintaining performance and error resilience.
