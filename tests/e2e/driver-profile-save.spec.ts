import { test, expect } from '@playwright/test'

test.describe('Driver Profile Save', () => {
  test('should auto-create users and driver_profiles records on first save', async ({ page }) => {
    await page.goto('http://localhost:5177')

    await test.step('Login as driver', async () => {
      await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
      await page.getByRole('textbox', { name: 'Email' }).fill('driver@itboy.ir')
      await page.getByRole('textbox', { name: 'Password' }).fill('123123@')
      await page.getByRole('button', { name: 'Sign In', exact: true }).click()
      await page.waitForTimeout(2000)
    })

    await test.step('Navigate to driver profile', async () => {
      await page.getByRole('button', { name: /driver@itboy.ir/ }).click()
      await page.getByRole('button', { name: 'Profile' }).click()
      await page.waitForTimeout(1500)
    })

    await test.step('Verify initial data from directus_users', async () => {
      await expect(page.getByRole('heading', { name: /babak driver/ })).toBeVisible()
      await expect(page.getByText('driver@itboy.ir')).toBeVisible()
    })

    await test.step('Edit profile and add phone', async () => {
      await page.getByRole('button', { name: 'Edit' }).click()
      
      const phoneInput = page.locator('input[type="tel"]')
      await phoneInput.fill('09123456789')
      
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await page.waitForTimeout(1500)
    })

    await test.step('Verify save was successful', async () => {
      await expect(page.getByText('09123456789')).toBeVisible()
    })

    await test.step('Verify records were created via API', async () => {
      const token = await page.evaluate(() => localStorage.getItem('auth_token'))
      const userId = await page.evaluate(() => localStorage.getItem('user_id'))

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      const usersRes = await fetch(
        `http://localhost:5177/api/items/users?filter={"user_id":{"_eq":"${userId}"}}`,
        { headers }
      )
      const usersData = await usersRes.json()

      expect(usersRes.status).toBe(200)
      expect(usersData.data.length).toBeGreaterThan(0)
      expect(usersData.data[0].phone).toBe('09123456789')

      const driverRes = await fetch(
        `http://localhost:5177/api/items/driver_profiles?filter={"user_id":{"_eq":"${userId}"}}`,
        { headers }
      )
      const driverData = await driverRes.json()

      expect(driverRes.status).toBe(200)
      expect(driverData.data.length).toBeGreaterThan(0)
    })
  })

  test('should update existing records on subsequent saves', async ({ page }) => {
    await page.goto('http://localhost:5177')

    await test.step('Login as driver', async () => {
      await page.getByRole('button', { name: 'Sign In / Sign Up' }).click()
      await page.getByRole('textbox', { name: 'Email' }).fill('driver@itboy.ir')
      await page.getByRole('textbox', { name: 'Password' }).fill('123123@')
      await page.getByRole('button', { name: 'Sign In', exact: true }).click()
      await page.waitForTimeout(2000)
    })

    await test.step('Navigate to driver profile', async () => {
      await page.getByRole('button', { name: /driver@itboy.ir/ }).click()
      await page.getByRole('button', { name: 'Profile' }).click()
      await page.waitForTimeout(1500)
    })

    await test.step('Edit license information', async () => {
      await page.getByRole('button', { name: 'Edit' }).click()
      
      const licenseInput = page.locator('input[type="text"]').nth(3)
      await licenseInput.fill('DL12345678')
      
      const experienceInput = page.locator('input[type="number"]')
      await experienceInput.fill('5')
      
      await page.getByRole('button', { name: 'Save Changes' }).click()
      await page.waitForTimeout(1500)
    })

    await test.step('Verify updates were saved', async () => {
      await expect(page.getByText('DL12345678')).toBeVisible()
      await expect(page.getByText('5 years')).toBeVisible()
    })
  })
})
