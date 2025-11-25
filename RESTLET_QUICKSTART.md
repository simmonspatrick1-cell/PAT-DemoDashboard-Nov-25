# 🚀 RESTlet Quick Start (5 Minutes)

## Copy-Paste Setup Guide

### 1️⃣ Upload to NetSuite (2 min)

1. **Documents > Files > File Cabinet**
2. Create folder: `/SuiteScripts/RESTlets/`
3. Upload: `composite_project_create.js`

### 2️⃣ Create Script (1 min)

1. **Customization > Scripting > Scripts > New**
2. Select file: `/SuiteScripts/RESTlets/composite_project_create.js`
3. Click **Save**

### 3️⃣ Create Deployment (1 min)

1. On script page, click **New Deployment**
2. Set:
   - Title: `Composite Project Create - Production`
   - Status: `Testing`
   - Audience: `All Roles`
3. Copy the **External URL**
4. Click **Save**

### 4️⃣ Set Permissions (1 min)

**Setup > Users/Roles > Manage Roles** > Edit your role:

**Permissions Tab > Setup:**
- REST Web Services: Full
- RESTlets: Full
- Log in using OAuth 2.0 Access Tokens: Full

**Permissions Tab > Transactions:**
- Project (Job): Create, Edit, View
- Project Task: Create, Edit, View

Click **Save**

---

## 🧪 Test It Now

### cURL Test
```bash
curl -X POST '<YOUR_EXTERNAL_URL>' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_OAUTH_TOKEN>' \
  -d '{
    "project": {
      "name": "Test Project",
      "entityid": "TEST-001",
      "customerId": 3161
    },
    "tasks": [
      {
        "name": "Discovery",
        "plannedWork": 40,
        "serviceItem": "PS - Discovery & Design Strategy",
        "billingClass": "1",
        "unitCost": 150
      }
    ]
  }'
```

### Success Response
```json
{
  "success": true,
  "data": {
    "projectId": 12345,
    "taskIds": [67890],
    "taskCount": 1
  }
}
```

---

## ✅ Done!

**Verify**: Go to **Lists > Relationships > Projects** and search for `TEST-001`

**See**: [RESTLET_DEPLOYMENT_GUIDE.md](RESTLET_DEPLOYMENT_GUIDE.md) for detailed instructions

---

## 🔗 Add to Your .env

```bash
NETSUITE_RESTLET_COMPOSITE_PROJECT_URL=<YOUR_EXTERNAL_URL>
```

Replace `<YOUR_EXTERNAL_URL>` with the URL from Step 3.
