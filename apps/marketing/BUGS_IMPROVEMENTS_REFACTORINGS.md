# Code Analysis: Bugs, Improvements & Refactorings

## 🐛 Bugs (5)

### 1. **Variable Access Before Declaration in useThreatSimulatorGame.ts**

**Severity**: High  
**File**: `src/components/hooks/useThreatSimulatorGame.ts:105`  
**Issue**: `resourceManager` is accessed on line 105 before it's declared on
line 118. This violates React Hooks rules and can cause runtime errors.

```typescript
// Line 105: Accessing before declaration
resourceManager.awardPerformanceRewards(...)

// Line 118: Declaration
const [resourceManager] = useState(() => createResourceManager());
```

**Fix**: Move the `resourceManager` declaration above the `waveManager`
initialization.

### 2. **Memory Leak: CSS Styles Not Cleaned Up on Error**

**Severity**: Medium  
**File**: `src/components/WasmThreatSimulator.tsx:308-312`  
**Issue**: When WASM style loading fails, the cleanup function in the useEffect
doesn't run, potentially leaving orphaned style elements in the DOM.

```typescript
} catch (err) {
  console.warn("Failed to load WASM styles:", err);
  setWasmStylesLoaded(true); // Continue without styles
  // Missing: cleanup of any partially created elements
}
```

**Fix**: Ensure cleanup happens even on error paths.

### 3. **Race Condition in WASM Initialization**

**Severity**: Medium  
**File**: `src/components/WasmThreatSimulator.tsx:132-136`  
**Issue**: The ID restoration uses `setTimeout` with a fixed 100ms delay, which
may not be sufficient for slow devices or may be unnecessarily long for fast
devices.

```typescript
setTimeout(() => {
  if (mountElement && mounted) {
    mountElement.id = originalId;
  }
}, 100);
```

**Fix**: Use a callback-based approach or wait for a specific WASM
initialization event rather than arbitrary timeout.

### 4. **Singleton Pattern Broken on Component Remount**

**Severity**: Medium  
**File**: `src/components/WasmThreatSimulator.tsx:14, 170`  
**Issue**: The module-level `wasmInstanceInitialized` flag is reset in the
cleanup, but if the component remounts immediately (e.g., during fast refresh),
the WASM module itself may still be loaded in memory.

```typescript
let wasmInstanceInitialized = false; // Module level

return () => {
  mounted = false;
  wasmInstanceInitialized = false; // Reset on unmount
};
```

**Fix**: Check actual WASM module state rather than just a flag.

### 5. **Missing Error Boundary for WASM Failures**

**Severity**: Medium  
**File**: `src/app/interactive-demo/page.tsx`  
**Issue**: If the WasmThreatSimulator component throws an error during
initialization, it could crash the entire page with no graceful fallback.

```tsx
<WasmThreatSimulator />
```

**Fix**: Wrap with an Error Boundary component to show a friendly error message.

---

## 🎯 Improvements (5)

### 1. **Add Loading Progress Indicator**

**Priority**: High  
**File**: `src/components/WasmThreatSimulator.tsx:335-340`  
**Current**: Shows generic "Loading Threat Simulator..." message  
**Improvement**: Add actual progress tracking for WASM download/initialization

```typescript
const [loadingProgress, setLoadingProgress] = useState(0);

// Track fetch progress
const response = await fetch(wasmUrl);
const reader = response.body.getReader();
const contentLength = +response.headers.get("Content-Length");
// ... update progress as chunks download
```

### 2. **Memoize CSS Scoping Plugin**

**Priority**: Medium  
**File**: `src/components/WasmThreatSimulator.tsx:195-296`  
**Current**: CSS scoping plugin is recreated on every render  
**Improvement**: Memoize the plugin creation since it only depends on
`uniqueMountId`

```typescript
const scopePlugin = useMemo(() => {
  return () => {
    // ... plugin logic
  };
}, [uniqueMountId]);
```

### 3. **Add Retry Logic for Failed WASM Loads**

**Priority**: Medium  
**File**: `src/components/WasmThreatSimulator.tsx:45-163`  
**Current**: Single attempt to load WASM, fails permanently on network error  
**Improvement**: Add exponential backoff retry mechanism

```typescript
const loadWithRetry = async (url: string, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, i)),
      );
    }
  }
};
```

### 4. **Add Telemetry for WASM Load Performance**

**Priority**: Low  
**File**: `src/components/WasmThreatSimulator.tsx`  
**Current**: No performance tracking  
**Improvement**: Track and report WASM initialization time

```typescript
const startTime = performance.now();
await init({ module_or_path: wasmUrl });
const loadTime = performance.now() - startTime;
console.info(`WASM loaded in ${loadTime.toFixed(2)}ms`);
// Send to analytics if available
```

### 5. **Improve Accessibility of Loading State**

**Priority**: High  
**File**: `src/components/WasmThreatSimulator.tsx:335-341`  
**Current**: Loading state is only visual  
**Improvement**: Add proper ARIA live region for screen readers

```typescript
<div
  className={styles.loadingOverlay}
  role="status"
  aria-live="polite"
  aria-label="Loading threat simulator"
>
  <div className={styles.loadingText}>
    ⚡ Loading Threat Simulator...
  </div>
</div>
```

---

## 🔨 Refactorings (5)

### 1. **Extract WASM Asset Loading Logic**

**Priority**: High  
**File**: `src/components/WasmThreatSimulator.tsx:65-129`  
**Current**: Asset loading is mixed with initialization logic  
**Refactor**: Create a separate hook `useWasmAssets`

```typescript
// New file: src/hooks/useWasmAssets.ts
export function useWasmAssets() {
  const [assets, setAssets] = useState<WasmAssets | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadWasmAssets().then(setAssets).catch(setError);
  }, []);

  return { assets, error, isLoading: !assets && !error };
}
```

### 2. **Extract CSS Scoping Logic to Separate Module**

**Priority**: High  
**File**: `src/components/WasmThreatSimulator.tsx:195-296`  
**Current**: 100+ lines of CSS scoping logic inline in component  
**Refactor**: Move to `src/utils/wasmCssScoper.ts`

```typescript
// New file: src/utils/wasmCssScoper.ts
export function createWasmCssScopingPlugin(
  uniqueMountId: string,
  scopeClass: string,
  keyframePrefix: string,
) {
  return {
    postcssPlugin: "scope-wasm-css",
    Once(root: PostCSSRoot) {
      // ... existing logic
    },
  };
}
```

### 3. **Split Component into Presentation and Logic**

**Priority**: Medium  
**File**: `src/components/WasmThreatSimulator.tsx`  
**Current**: 361 lines mixing logic and presentation  
**Refactor**: Use container/presenter pattern

```typescript
// WasmThreatSimulatorContainer.tsx (logic)
export function useWasmThreatSimulator(props) {
  // All hooks and state logic
  return { isLoading, error, wasmInitialized, ... };
}

// WasmThreatSimulator.tsx (presentation)
export function WasmThreatSimulator(props) {
  const state = useWasmThreatSimulator(props);
  return <WasmThreatSimulatorView {...state} />;
}
```

### 4. **Replace Magic Numbers with Named Constants**

**Priority**: Low  
**File**: `src/components/WasmThreatSimulator.tsx`  
**Current**: Magic numbers scattered throughout (100, 10, 50, etc.)  
**Refactor**: Define constants at module level

```typescript
const WASM_INIT_TIMEOUT_MS = 100;
const MOUNT_RETRY_INTERVAL_MS = 50;
const MAX_MOUNT_RETRIES = 10;

// Usage
setTimeout(() => {
  if (mountElement && mounted) {
    mountElement.id = originalId;
  }
}, WASM_INIT_TIMEOUT_MS);
```

### 5. **Improve Type Safety for PostCSS Interfaces**

**Priority**: Medium  
**File**: `src/components/WasmThreatSimulator.tsx:196-227`  
**Current**: Manual TypeScript interfaces for PostCSS  
**Refactor**: Import types from postcss package or create a shared types file

```typescript
// Instead of inline interfaces, use:
import type {
  Root as PostCSSRoot,
  AtRule as PostCSSAtRule,
  Rule as PostCSSRule,
  Declaration as PostCSSDecl,
} from "postcss";

// Or create src/types/postcss.d.ts if types aren't available
```

---

## 📊 Summary

- **Total Issues Found**: 15
- **Critical Bugs**: 1 (Variable access before declaration)
- **High Priority Improvements**: 2
- **High Priority Refactorings**: 2

## 🎬 Next Steps

1. Fix critical bug #1 (variable access before declaration)
2. Implement high-priority improvements (#1 and #5)
3. Refactor CSS scoping logic to separate module (#2)
4. Add error boundary for WASM failures (#5 from bugs)
5. Document and test all changes
