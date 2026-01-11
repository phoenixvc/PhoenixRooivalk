# Phased Test Plan for Detector Codebase

## Current Status

**Test Coverage: ~15%** (174 tests total, all passing)

### Coverage by Module

- ✅ `config/constants.py` - 100% coverage
- ✅ `utils/geometry.py` - 96% coverage
- ✅ `interfaces.py` - 84% coverage
- ✅ `targeting.py` - 82% coverage
- ⚠️ `config/settings.py` - 46% coverage
- ⚠️ `streaming.py` - 41% coverage
- ❌ `main.py` - 0% coverage (partially addressed with integration tests)
- ❌ `factory.py` - 0% coverage (✅ **COMPLETED** - 12 tests added)
- ❌ `alert_handlers.py` - 0% coverage
- ❌ `frame_sources.py` - 0% coverage
- ❌ `inference_engines.py` - 0% coverage
- ❌ `renderers.py` - 0% coverage
- ❌ `hardware.py` - 0% coverage
- ❌ `trackers.py` - 0% coverage

---

## Phase 1: Core Factory & Pipeline ✅ COMPLETE

**Status:** ✅ Completed

**Tests Added:**

- ✅ `tests/unit/test_factory.py` - 12 tests
  - DetectionPipeline class (start, stop, initialization)
  - create_pipeline() with various configurations
  - create_minimal_pipeline() and create_demo_pipeline()

**Coverage Improvement:** Factory module now has comprehensive test coverage

---

## Phase 2: Configuration & Settings Edge Cases

**Goal:** Improve `config/settings.py` coverage from 46% to 70%+

**Estimated Tests:** 15-20 tests

**Test Areas:**

1. **Environment Variable Loading**
   - Test env prefix handling (CAPTURE*, INFERENCE*, etc.)
   - Test nested delimiter handling (\_\_)
   - Test .env file loading

2. **Validation Edge Cases**
   - Boundary value testing (min/max)
   - Invalid value rejection
   - Type coercion and validation

3. **Settings Classes Edge Cases**
   - Missing optional fields
   - Invalid enum values
   - Nested settings initialization

4. **YAML/JSON Loading Edge Cases**
   - Invalid YAML format
   - Missing required fields
   - Extra fields handling
   - Type conversions in YAML

5. **Settings Merging**
   - CLI args override config file
   - Environment vars override defaults
   - Priority order validation

**Test File:** `tests/unit/test_settings_edge_cases.py`

---

## Phase 3: Frame Sources

**Goal:** Add unit tests for frame source creation and operations

**Estimated Tests:** 20-25 tests

**Test Areas:**

1. **MockFrameSource**
   - Frame generation
   - Timestamp handling
   - Resolution configuration

2. **VideoFileSource** (with mocked OpenCV)
   - File loading
   - Video properties (fps, resolution)
   - Loop behavior

3. **USBCameraSource** (with mocked OpenCV)
   - Camera index selection
   - Resolution setting
   - FPS configuration

4. **PiCameraSource** (with mocked picamera2)
   - Camera initialization
   - Configuration
   - Error handling (no camera)

5. **create_frame_source() Factory**
   - Auto-detection logic
   - Source type selection
   - Fallback behavior

**Test File:** `tests/unit/test_frame_sources.py`

**Challenges:**

- Requires mocking OpenCV (cv2)
- Requires mocking picamera2
- Need to mock file I/O

---

## Phase 4: Inference Engines

**Goal:** Add unit tests for inference engine creation and operations

**Estimated Tests:** 25-30 tests

**Test Areas:**

1. **MockInferenceEngine**
   - Mock detection generation
   - Confidence threshold application
   - NMS application

2. **create_inference_engine() Factory**
   - Auto-detection from model path
   - Engine type selection
   - Coral fallback logic
   - Error handling (missing files)

3. **BaseInferenceEngine** (abstract class)
   - Interface compliance
   - Common functionality

4. **Engine-Specific Tests** (with mocks)
   - TFLiteEngine (mock tflite_runtime)
   - ONNXEngine (mock onnxruntime)
   - CoralEngine (mock pycoral)
   - Model loading error handling

**Test File:** `tests/unit/test_inference_engines.py`

**Challenges:**

- Requires mocking ML libraries
- Model file handling
- Hardware dependencies (Coral TPU)

---

## Phase 5: Alert Handlers

**Goal:** Add unit tests for alert handler system

**Estimated Tests:** 20-25 tests

**Test Areas:**

1. **ConsoleAlertHandler**
   - Alert formatting
   - Output verification

2. **WebhookAlertHandler**
   - HTTP request generation
   - Retry logic
   - Error handling
   - Timeout handling

3. **FileAlertHandler**
   - JSON file writing
   - File rotation
   - Error handling

4. **CompositeAlertHandler**
   - Multiple handler coordination
   - Error isolation
   - Flush behavior

5. **ThrottledAlertHandler**
   - Cooldown logic
   - Rate limiting
   - Track-based throttling

6. **create_alert_handler() Factory**
   - Handler type selection
   - Configuration passing

**Test File:** `tests/unit/test_alert_handlers.py`

**Challenges:**

- Requires mocking HTTP requests
- File I/O testing
- Async behavior (if applicable)

---

## Phase 6: Renderers & Display

**Goal:** Add unit tests for renderer system

**Estimated Tests:** 15-20 tests

**Test Areas:**

1. **OpenCVRenderer**
   - Frame rendering
   - Overlay drawing
   - Window management (mocked)

2. **HeadlessRenderer**
   - Frame processing
   - Logging behavior
   - No-op display operations

3. **create_renderer() Factory**
   - Renderer type selection
   - Headless mode handling

**Test File:** `tests/unit/test_renderers.py`

**Challenges:**

- Requires mocking OpenCV display
- Window management mocking

---

## Phase 7: Trackers

**Goal:** Add unit tests for tracking algorithms

**Estimated Tests:** 20-25 tests

**Test Areas:**

1. **NoOpTracker**
   - Pass-through behavior
   - Interface compliance

2. **CentroidTracker**
   - Track creation
   - Track updates
   - Track deletion (max_disappeared)
   - Distance matching

3. **KalmanTracker**
   - Kalman filter integration
   - Motion prediction
   - State updates

4. **create_tracker() Factory**
   - Tracker type selection
   - Configuration passing

**Test File:** `tests/unit/test_trackers.py`

**Challenges:**

- Kalman filter algorithm testing
- Track ID management
- State persistence

---

## Phase 8: Hardware Detection

**Goal:** Add unit tests for hardware detection

**Estimated Tests:** 15-20 tests

**Test Areas:**

1. **Platform Detection**
   - Linux detection
   - Raspberry Pi detection
   - Desktop detection

2. **Hardware Profile**
   - Profile creation
   - Recommendation logic
   - Accelerator detection (mocked)

3. **Hardware-Specific Tests** (with mocks)
   - RAM detection
   - Camera detection
   - Coral TPU detection

**Test File:** `tests/unit/test_hardware.py`

**Challenges:**

- Requires mocking system calls
- Platform-specific behavior
- Hardware dependency mocking

---

## Phase 9: Integration Tests - Full Workflows

**Goal:** Add integration tests for complete workflows

**Estimated Tests:** 10-15 tests

**Test Areas:**

1. **Full Pipeline Workflows**
   - Mock pipeline → inference → tracking → alert
   - Config file → pipeline creation
   - CLI args → pipeline execution

2. **End-to-End Scenarios**
   - Detection → tracking → alert flow
   - Error recovery
   - Graceful shutdown

3. **Configuration Workflows**
   - Generate config → load config → run
   - CLI overrides → config file
   - Environment vars → settings

**Test File:** `tests/integration/test_workflows.py`

**Challenges:**

- Requires full system mocking
- Complex setup/teardown
- Timing-sensitive operations

---

## Phase 10: Main Entry Point

**Goal:** Improve main.py test coverage

**Estimated Tests:** 15-20 tests

**Test Areas:**

1. **Argument Parsing**
   - All flag combinations
   - Invalid arguments
   - Default values

2. **Main Function Logic**
   - Config loading
   - Pipeline creation
   - Error handling
   - Exit codes

3. **Signal Handling**
   - SIGINT handling
   - SIGTERM handling
   - Graceful shutdown

**Test File:** `tests/integration/test_main.py` (extend existing)

**Note:** Partially covered in `test_main_cli.py`, but needs deeper coverage

---

## Implementation Order & Priority

### High Priority (Core Functionality)

1. ✅ **Phase 1: Factory & Pipeline** - COMPLETE
2. **Phase 2: Settings Edge Cases** - Next
3. **Phase 4: Inference Engines** - Critical for ML
4. **Phase 3: Frame Sources** - Critical for input

### Medium Priority (Supporting Systems)

5. **Phase 5: Alert Handlers** - Important for output
6. **Phase 6: Renderers** - Display functionality
7. **Phase 7: Trackers** - Core algorithm

### Lower Priority (System Integration)

8. **Phase 8: Hardware Detection** - Platform-specific
9. **Phase 9: Integration Workflows** - End-to-end
10. **Phase 10: Main Entry Point** - Already partially covered

---

## Success Metrics

### Coverage Goals

- **Phase 1-3:** 30% overall coverage
- **Phase 1-5:** 50% overall coverage
- **Phase 1-7:** 65% overall coverage
- **Phase 1-10:** 75%+ overall coverage

### Test Quality Goals

- All tests pass consistently
- Tests are isolated (no interdependencies)
- Tests use appropriate mocking
- Tests cover edge cases and error paths
- Tests are maintainable and readable

---

## Notes

- Use pytest fixtures from `conftest.py` where possible
- Mock external dependencies (OpenCV, ML libraries, hardware)
- Focus on behavior, not implementation details
- Test error paths as well as success paths
- Keep tests fast (< 1s total per phase where possible)
