# Tests Quick Start Guide

## Overview
This project now has comprehensive unit and integration tests to prevent regressions and catch edge cases in the shipment details and bidding system.

## Test Suites

### E2E Tests (Playwright)
Located in `tests/e2e/`

1. **shipment-map-validation.spec.ts** (16 tests)
   - Validates coordinate handling
   - Tests Leaflet integration safety
   - Prevents "Invalid LatLng" errors

2. **shipment-details-error-handling.spec.ts** (27 tests)
   - Error scenario handling
   - Form validation
   - API error responses
   - Currency fallbacks

3. **shipment-details-location-handling.spec.ts** (21 tests)
   - Location data validation
   - Map rendering conditions
   - Route calculation logic
   - Address fallbacks

### Unit Tests (Requires Vitest Setup)
Located in `tests/unit/`

1. **ShipmentMap.test.jsx** (23 tests)
   - Component rendering logic
   - Coordinate validation
   - Address display
   - Props changes

2. **ShipmentDetailsForBidding.test.jsx** (26 tests)
   - Authentication checks
   - Data loading
   - Form validation
   - User bid separation

---

## Running Tests

### Quick Commands

**Run all E2E tests:**
```bash
npm test
```

**Run specific test file:**
```bash
npm test -- shipment-map-validation
```

**Run with browser visible:**
```bash
npm test:headed
```

**Debug mode (interactive):**
```bash
npm test:debug
```

---

## Key Test Scenarios

### ✅ Coordinate Validation Tests
Ensures ShipmentMap component doesn't crash with undefined coordinates.

```bash
npm test -- shipment-map-validation.spec.ts
```

**What it tests:**
- Undefined/null locations
- Missing lat/lng properties
- NaN and Infinity values
- Valid coordinate ranges

---

### ✅ Error Handling Tests
Catches API failures and invalid data gracefully.

```bash
npm test -- shipment-details-error-handling.spec.ts
```

**What it tests:**
- Missing authentication
- API 404/500 errors
- Empty/malformed responses
- Form validation failures
- Currency fallbacks

---

### ✅ Location Data Tests
Validates location processing before map rendering.

```bash
npm test -- shipment-details-location-handling.spec.ts
```

**What it tests:**
- Missing location objects
- Coordinate validation
- Address/coordinate fallbacks
- Route calculation conditions
- Type validation (string vs number)

---

## Test Results Expected

### E2E Tests
- **shipment-map-validation.spec.ts**: 14 passed (2 API fixes applied)
- **shipment-details-error-handling.spec.ts**: Expected to pass all tests
- **shipment-details-location-handling.spec.ts**: Expected to pass all tests

### Total Expected
- **Passed:** 60+ tests
- **Duration:** ~2-3 minutes

---

## Important Test Cases

### 🔴 Critical Issues Tested

1. **Leaflet Error Prevention**
   ```
   ❌ Before: "Invalid LatLng object: (undefined, undefined)"
   ✅ After: Tests ensure coordinates are validated first
   ```

2. **Route API Failure**
   ```
   ❌ Before: GET /route/v1/driving/undefined,undefined (400)
   ✅ After: Tests verify route only called with valid coords
   ```

3. **Missing Currency**
   ```
   ❌ Before: UI shows undefined currency
   ✅ After: Tests ensure fallback to 'OMR'
   ```

4. **Blank Page on Navigation**
   ```
   ❌ Before: Navigation to details page shows blank
   ✅ After: Tests validate location data loading
   ```

---

## Setting Up Unit Tests

Unit tests require additional dependencies:

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @vitest/ui
```

Update `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getViteConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js'
  }
})
```

Then run unit tests:
```bash
npm run test:unit
```

---

## CI/CD Integration

Add to GitHub Actions or CI pipeline:

```yaml
- name: Run Tests
  run: npm test -- --reporter=html

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: playwright-report
    path: playwright-report/
```

---

## Test File Structure

```
tests/
├── e2e/
│   ├── shipment-map-validation.spec.ts          (16 tests)
│   ├── shipment-details-error-handling.spec.ts  (27 tests)
│   ├── shipment-details-location-handling.spec.ts (21 tests)
│   ├── shipment-detail-diagnose.spec.ts         (existing)
│   └── ...
└── unit/
    ├── ShipmentMap.test.jsx                     (23 tests)
    ├── ShipmentDetailsForBidding.test.jsx       (26 tests)
    └── setup.js                                  (config)
```

---

## Debugging Failed Tests

### If test fails with coordinate error:
```bash
npm test -- shipment-map-validation.spec.ts --debug
```
Look for: Undefined lat/lng values in test output

### If test fails with API error:
```bash
npm test -- shipment-details-error-handling.spec.ts --debug
```
Check: Mock response status codes

### If test fails with location error:
```bash
npm test -- shipment-details-location-handling.spec.ts --debug
```
Verify: Location object structure in test data

---

## Test Naming Convention

**Test names describe the scenario:**
- ✅ "should handle undefined pickup location gracefully"
- ✅ "should validate quoted price is positive"
- ✅ "should prevent route calculation with undefined coordinates"

**Test file names indicate component:**
- `ShipmentMap.test.jsx` → ShipmentMap component
- `shipment-details-error-handling.spec.ts` → Error scenarios
- `shipment-details-location-handling.spec.ts` → Location logic

---

## Common Issues & Solutions

### Issue: Tests timeout
**Solution:** Increase timeout in playwright.config.js:
```javascript
timeout: 30000
```

### Issue: "page.querySelector is not a function"
**Solution:** Use `page.locator()` instead in Playwright tests

### Issue: Mocks not working in unit tests
**Solution:** Clear mocks between tests:
```javascript
beforeEach(() => {
  vi.clearAllMocks()
})
```

---

## Next Steps

1. ✅ Run `npm test` to validate all tests pass
2. ✅ Fix any remaining test failures
3. ✅ Set up unit test infrastructure (Vitest)
4. ✅ Add test results to CI/CD pipeline
5. ✅ Monitor test coverage (target: >80%)
6. ✅ Run tests before each deployment

---

## Documentation

- Full test details: `UNIT_TESTS_SUMMARY.md`
- Test results archive: `tests/test-results/`
- Playwright reports: `playwright-report/` (after running tests)
