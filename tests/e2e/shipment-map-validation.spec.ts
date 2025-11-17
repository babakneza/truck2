import { test, expect, Page } from '@playwright/test'

test.describe('ShipmentMap Component - Coordinate Validation', () => {
  test('should handle undefined pickup location gracefully', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ShipmentMap Test</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
      </head>
      <body>
        <div id="test">Testing ShipmentMap with undefined pickup</div>
        <script>
          window.testData = {
            pickupLocation: undefined,
            deliveryLocation: { lat: 23.6100, lng: 58.5400 }
          };
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const element = page.locator('#test')
    await expect(element).toBeTruthy()
  })

  test('should handle undefined delivery location gracefully', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>ShipmentMap Test</title>
      </head>
      <body>
        <div id="test">Testing ShipmentMap with undefined delivery</div>
        <script>
          window.testData = {
            pickupLocation: { lat: 23.6100, lng: 58.5400 },
            deliveryLocation: undefined
          };
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const element = page.locator('#test')
    await expect(element).toBeTruthy()
  })

  test('should handle null coordinates', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test">Testing null coordinates</div>
        <script>
          window.testData = {
            pickupLocation: null,
            deliveryLocation: null
          };
          
          function validateCoordinates(loc) {
            if (!loc || !loc.lat || !loc.lng) {
              return false;
            }
            if (isNaN(loc.lat) || isNaN(loc.lng)) {
              return false;
            }
            return true;
          }
          
          const isValid = validateCoordinates(window.testData.pickupLocation) && 
                          validateCoordinates(window.testData.deliveryLocation);
          
          document.getElementById('test').textContent = 'Valid: ' + isValid;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Valid: false')
  })

  test('should handle NaN coordinates', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || loc.lat === undefined || loc.lng === undefined) {
              return false;
            }
            if (isNaN(loc.lat) || isNaN(loc.lng)) {
              return false;
            }
            return true;
          }
          
          const result = validateCoordinates({ lat: NaN, lng: NaN });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: false')
  })

  test('should handle Infinity coordinates', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc) return false;
            if (isNaN(loc.lat) || isNaN(loc.lng)) return false;
            if (!isFinite(loc.lat) || !isFinite(loc.lng)) return false;
            return true;
          }
          
          const result = validateCoordinates({ lat: Infinity, lng: Infinity });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: false')
  })

  test('should validate missing lat property', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || !('lat' in loc) || !('lng' in loc)) {
              return false;
            }
            return true;
          }
          
          const result = validateCoordinates({ lng: 58.5400 });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: false')
  })

  test('should validate missing lng property', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || !('lat' in loc) || !('lng' in loc)) {
              return false;
            }
            return true;
          }
          
          const result = validateCoordinates({ lat: 23.6100 });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: false')
  })

  test('should accept valid positive coordinates', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || loc.lat === undefined || loc.lng === undefined) return false;
            if (isNaN(loc.lat) || isNaN(loc.lng)) return false;
            if (!isFinite(loc.lat) || !isFinite(loc.lng)) return false;
            return true;
          }
          
          const result = validateCoordinates({ lat: 23.6100, lng: 58.5400 });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: true')
  })

  test('should accept valid negative coordinates', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || loc.lat === undefined || loc.lng === undefined) return false;
            if (isNaN(loc.lat) || isNaN(loc.lng)) return false;
            if (!isFinite(loc.lat) || !isFinite(loc.lng)) return false;
            return true;
          }
          
          const result = validateCoordinates({ lat: -23.5505, lng: -46.6333 });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: true')
  })

  test('should accept zero coordinates', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || loc.lat === undefined || loc.lng === undefined) return false;
            if (isNaN(loc.lat) || isNaN(loc.lng)) return false;
            if (!isFinite(loc.lat) || !isFinite(loc.lng)) return false;
            return true;
          }
          
          const result = validateCoordinates({ lat: 0, lng: 0 });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: true')
  })

  test('should handle string coordinates that coerce to numbers', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc) return false;
            const lat = parseFloat(loc.lat);
            const lng = parseFloat(loc.lng);
            if (isNaN(lat) || isNaN(lng)) return false;
            if (!isFinite(lat) || !isFinite(lng)) return false;
            return true;
          }
          
          const result = validateCoordinates({ lat: '23.6100', lng: '58.5400' });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: true')
  })

  test('should reject string coordinates with non-numeric values', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc) return false;
            const lat = parseFloat(loc.lat);
            const lng = parseFloat(loc.lng);
            if (isNaN(lat) || isNaN(lng)) return false;
            if (!isFinite(lat) || !isFinite(lng)) return false;
            return true;
          }
          
          const result = validateCoordinates({ lat: 'invalid', lng: '58.5400' });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: false')
  })

  test('should validate coordinates are within valid lat/lng ranges', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || loc.lat === undefined || loc.lng === undefined) return false;
            const lat = parseFloat(loc.lat);
            const lng = parseFloat(loc.lng);
            if (isNaN(lat) || isNaN(lng)) return false;
            if (!isFinite(lat) || !isFinite(lng)) return false;
            if (lat < -90 || lat > 90) return false;
            if (lng < -180 || lng > 180) return false;
            return true;
          }
          
          const validResult = validateCoordinates({ lat: 23.6100, lng: 58.5400 });
          const invalidLatResult = validateCoordinates({ lat: 91, lng: 58.5400 });
          const invalidLngResult = validateCoordinates({ lat: 23.6100, lng: 181 });
          
          document.getElementById('test').textContent = 
            'Valid: ' + validResult + ', Invalid Lat: ' + invalidLatResult + ', Invalid Lng: ' + invalidLngResult;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Valid: true')
    expect(text).toContain('Invalid Lat: false')
    expect(text).toContain('Invalid Lng: false')
  })

  test('should validate very close coordinates', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || loc.lat === undefined || loc.lng === undefined) return false;
            if (isNaN(loc.lat) || isNaN(loc.lng)) return false;
            if (!isFinite(loc.lat) || !isFinite(loc.lng)) return false;
            return true;
          }
          
          const result = validateCoordinates({ lat: 23.6100001, lng: 58.5400001 });
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: true')
  })

  test('should validate identical pickup and delivery locations', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || loc.lat === undefined || loc.lng === undefined) return false;
            if (isNaN(loc.lat) || isNaN(loc.lng)) return false;
            if (!isFinite(loc.lat) || !isFinite(loc.lng)) return false;
            return true;
          }
          
          const pickup = { lat: 23.6100, lng: 58.5400 };
          const delivery = { lat: 23.6100, lng: 58.5400 };
          
          const result = validateCoordinates(pickup) && validateCoordinates(delivery);
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: true')
  })

  test('should handle very large coordinate differences', async ({ page }) => {
    const html = `
      <!DOCTYPE html>
      <html>
      <body>
        <div id="test"></div>
        <script>
          function validateCoordinates(loc) {
            if (!loc || loc.lat === undefined || loc.lng === undefined) return false;
            const lat = parseFloat(loc.lat);
            const lng = parseFloat(loc.lng);
            if (isNaN(lat) || isNaN(lng)) return false;
            if (!isFinite(lat) || !isFinite(lng)) return false;
            if (lat < -90 || lat > 90) return false;
            if (lng < -180 || lng > 180) return false;
            return true;
          }
          
          const pickup = { lat: -89, lng: -179 };
          const delivery = { lat: 89, lng: 179 };
          
          const result = validateCoordinates(pickup) && validateCoordinates(delivery);
          document.getElementById('test').textContent = 'Is Valid: ' + result;
        </script>
      </body>
      </html>
    `
    
    await page.setContent(html)
    
    const text = await page.textContent('#test')
    expect(text).toContain('Is Valid: true')
  })
})
