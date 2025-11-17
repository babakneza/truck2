# Database Field Addition Instructions

## Required Fields for Shipper Profile

Two new fields need to be added to the `shipper_profiles` collection in Directus:

### 1. Nationality Field
### 2. ID Number Field

---

## Method 1: Via Directus Admin Panel (Recommended)

### Step-by-Step Instructions

1. **Login to Directus Admin Panel**
   - URL: https://admin.itboy.ir
   - Use your admin credentials

2. **Navigate to Data Model**
   - Click on "Settings" (gear icon) in the sidebar
   - Click on "Data Model"

3. **Select shipper_profiles Collection**
   - Find and click on "shipper_profiles" in the collections list

4. **Add Nationality Field**
   - Click "+ Create Field" button
   - Select "Input" as the field type
   - Configure as follows:

   **Field Configuration:**
   ```
   Field Name: nationality
   Type: String
   Interface: Input
   Max Length: 100
   ```

   **Display Options:**
   ```
   Placeholder: e.g., Omani, Indian, Pakistani
   Icon: flag (optional)
   Width: Half
   ```

   **Validation:**
   ```
   Required: No
   Nullable: Yes
   ```

   **Note:**
   ```
   Shipper's nationality for verification purposes
   ```

   - Click "Save"

5. **Add ID Number Field**
   - Click "+ Create Field" button again
   - Select "Input" as the field type
   - Configure as follows:

   **Field Configuration:**
   ```
   Field Name: id_number
   Type: String
   Interface: Input
   Max Length: 100
   ```

   **Display Options:**
   ```
   Placeholder: National ID / Passport Number
   Icon: hash (optional)
   Width: Half
   ```

   **Validation:**
   ```
   Required: No
   Nullable: Yes
   ```

   **Note:**
   ```
   National ID or Passport Number for identity verification
   ```

   - Click "Save"

6. **Verify Fields**
   - Go to "Content" → "shipper_profiles"
   - Click on any existing record or create a new one
   - Verify that both fields appear in the form
   - Test entering data in both fields

---

## Method 2: Via Directus API (Alternative)

If you prefer to add fields programmatically, use the following API calls:

### Prerequisites
- Admin access token
- API access to Directus

### Add Nationality Field

```bash
curl -X POST https://admin.itboy.ir/fields/shipper_profiles/nationality \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "nationality",
    "type": "string",
    "meta": {
      "interface": "input",
      "options": {
        "placeholder": "e.g., Omani, Indian, Pakistani"
      },
      "display": "raw",
      "readonly": false,
      "hidden": false,
      "width": "half",
      "note": "Shipper nationality"
    },
    "schema": {
      "name": "nationality",
      "table": "shipper_profiles",
      "data_type": "varchar",
      "max_length": 100,
      "is_nullable": true
    }
  }'
```

### Add ID Number Field

```bash
curl -X POST https://admin.itboy.ir/fields/shipper_profiles/id_number \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "id_number",
    "type": "string",
    "meta": {
      "interface": "input",
      "options": {
        "placeholder": "National ID / Passport Number"
      },
      "display": "raw",
      "readonly": false,
      "hidden": false,
      "width": "half",
      "note": "National ID or Passport Number"
    },
    "schema": {
      "name": "id_number",
      "table": "shipper_profiles",
      "data_type": "varchar",
      "max_length": 100,
      "is_nullable": true
    }
  }'
```

---

## Method 3: Via Node.js Script (Automated)

A script has been created at `add-shipper-profile-fields.mjs` but requires a valid admin token.

### Update the Script

1. Open `add-shipper-profile-fields.mjs`
2. Replace the `ADMIN_TOKEN` with your current admin token
3. Run the script:

```bash
node add-shipper-profile-fields.mjs
```

---

## Verification Steps

After adding the fields, verify they work correctly:

### 1. Check in Directus Admin
- Navigate to Content → shipper_profiles
- Open any record
- Verify both fields appear
- Enter test data
- Save and verify data persists

### 2. Check in Application
- Login to the application as a shipper
- Navigate to Profile page
- Click "Edit Profile"
- Verify both fields appear in the Personal Info tab:
  - Nationality (with Flag icon)
  - ID Number (with Hash icon)
- Enter test data
- Click "Save Changes"
- Refresh the page
- Verify data persists

### 3. Check via API
```bash
curl https://admin.itboy.ir/api/items/shipper_profiles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Look for `nationality` and `id_number` in the response.

---

## Field Specifications

### Nationality Field

| Property | Value |
|----------|-------|
| Field Name | `nationality` |
| Data Type | `varchar(100)` |
| Nullable | Yes |
| Default | NULL |
| Interface | Input |
| Placeholder | "e.g., Omani, Indian, Pakistani" |
| Icon | Flag 🚩 |
| Width | Half |

**Purpose:** Store the shipper's nationality for verification and compliance purposes.

**Examples:**
- Omani
- Indian
- Pakistani
- Bangladeshi
- Egyptian
- Saudi Arabian

### ID Number Field

| Property | Value |
|----------|-------|
| Field Name | `id_number` |
| Data Type | `varchar(100)` |
| Nullable | Yes |
| Default | NULL |
| Interface | Input |
| Placeholder | "National ID / Passport Number" |
| Icon | Hash # |
| Width | Half |

**Purpose:** Store the shipper's national ID or passport number for identity verification.

**Examples:**
- 12345678 (National ID)
- A1234567 (Passport)
- 123-456-789 (Formatted ID)

---

## Permissions

Ensure the following permissions are set for the new fields:

### Shipper Role
- **Read**: ✅ Own records only
- **Create**: ✅ Yes
- **Update**: ✅ Own records only
- **Delete**: ❌ No

### Admin Role
- **Read**: ✅ All records
- **Create**: ✅ Yes
- **Update**: ✅ All records
- **Delete**: ✅ Yes

### Anonymous Role
- **Read**: ❌ No
- **Create**: ❌ No
- **Update**: ❌ No
- **Delete**: ❌ No

---

## Troubleshooting

### Issue: Fields don't appear in admin panel
**Solution:** Clear browser cache and refresh

### Issue: Fields don't save data
**Solution:** Check field permissions for the shipper role

### Issue: API returns 403 error
**Solution:** Verify the user has permission to read/write these fields

### Issue: Fields appear but are empty
**Solution:** This is normal for existing records. Data will be added when users edit their profiles.

---

## Migration Notes

### For Existing Records
- Both fields will be NULL for existing shipper profiles
- Users can fill them in when they edit their profile
- No data migration is required

### For New Records
- Fields will be empty by default
- Users should be prompted to fill them during onboarding
- Consider making them required in the future

---

## Security Considerations

### Data Privacy
- ID numbers are sensitive personal information
- Ensure proper encryption at rest
- Limit access to authorized personnel only
- Consider masking in logs and error messages

### Validation
- Consider adding format validation for ID numbers
- Validate nationality against a list of countries
- Implement server-side validation
- Add client-side validation for better UX

### Compliance
- Ensure compliance with data protection regulations
- Add consent checkboxes if required
- Implement data retention policies
- Provide data export/deletion options

---

## Next Steps After Adding Fields

1. ✅ Verify fields appear in Directus admin
2. ✅ Test creating/updating records
3. ✅ Check permissions are correct
4. ✅ Test in the application UI
5. ✅ Add validation rules (optional)
6. ✅ Update documentation
7. ✅ Train users on new fields
8. ✅ Monitor for issues

---

**Status:** Ready to implement
**Priority:** High
**Estimated Time:** 10-15 minutes
**Difficulty:** Easy

**Last Updated:** November 11, 2025
