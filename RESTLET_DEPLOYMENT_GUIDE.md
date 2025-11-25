# Composite RESTlet Deployment Guide

## 📋 Overview

This guide walks you through deploying the **Composite Project + Tasks Creation RESTlet** to your NetSuite account. This RESTlet enables atomic project creation with automatic rollback on failures.

---

## ✅ Pre-Deployment Checklist

Before starting, ensure you have:
- [ ] NetSuite Administrator or Developer access
- [ ] Access to File Cabinet
- [ ] Permission to create Script records
- [ ] A role with Script permissions
- [ ] (Optional) OAuth 2.0 M2M configured for testing

---

## 📁 Step 1: Upload Script to File Cabinet

### 1.1 Navigate to File Cabinet
1. Login to NetSuite
2. Go to: **Documents > Files > File Cabinet**
3. Create folder structure: `/SuiteScripts/RESTlets/`

### 1.2 Create Folder (if needed)
```
SuiteScripts/
  └── RESTlets/
      └── composite_project_create.js
```

**Create Folders:**
1. Click **New** > **Folder**
2. Name: `SuiteScripts`
3. Click **Save**
4. Open `SuiteScripts` folder
5. Click **New** > **Folder**
6. Name: `RESTlets`
7. Click **Save**

### 1.3 Upload the Script File
1. Open the `RESTlets` folder
2. Click **Upload** (or **New** > **File**)
3. Choose file: `suitescripts/restlets/composite_project_create.js`
4. File Name: `composite_project_create.js`
5. Description: `Composite Project + Tasks Creation with Rollback`
6. Click **Save**

**Result**: You should see the file at:
```
/SuiteScripts/RESTlets/composite_project_create.js
```

---

## 🔧 Step 2: Create Script Record

### 2.1 Navigate to Scripts
1. Go to: **Customization > Scripting > Scripts**
2. Click **New**

### 2.2 Select Script File
1. Click **Select File** (or the folder icon)
2. Navigate to: `/SuiteScripts/RESTlets/`
3. Select: `composite_project_create.js`
4. Click **Select**

### 2.3 Configure Script Record
NetSuite will auto-populate most fields from the `@NApiVersion` and `@NScriptType` tags.

**Verify these settings:**

| Field | Value |
|-------|-------|
| **Name** | Composite Project Create |
| **ID** | `_composite_project_create` (auto-generated) |
| **API Version** | 2.1 |
| **Status** | Testing (change to Released after testing) |

**Script Parameters** (if you want to add custom ones):
- None required for basic functionality

**Click Save**

---

## 🚀 Step 3: Create Deployment

After saving the Script record, you'll be on the Script Details page.

### 3.1 Create New Deployment
1. Scroll to **Deployments** subtab
2. Click **New Deployment**

### 3.2 Configure Deployment Settings

#### Basic Information
| Field | Value | Notes |
|-------|-------|-------|
| **Title** | Composite Project Create - Production | Descriptive title |
| **ID** | Auto-generated | e.g., `customdeploy_composite_proj` |
| **Status** | **Testing** | Change to Released after testing |
| **Log Level** | **Debug** | For initial testing; change to Error in prod |

#### Audience
| Field | Value |
|-------|-------|
| **Audience** | All Roles |
| **Specific Roles** | (Optional) Select specific roles if needed |
| **Specific Employees** | (Leave blank unless restricting) |

**Important**: If using OAuth 2.0 M2M, ensure the role mapped to your certificate has access!

#### Execution Context
The script will auto-populate these based on `@NScriptType Restlet`:
- ✅ **RESTlet** should be checked
- HTTP Methods: GET, POST (both enabled)

### 3.3 Get the External URL
After saving the deployment:

1. Find the **External URL** field
2. Copy this URL - you'll need it for API calls!

**Example URL format:**
```
https://TD3049589.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=123&deploy=1
```

**Click Save**

---

## 🔐 Step 4: Configure Role Permissions

The role you use to call this RESTlet must have these permissions:

### 4.1 Navigate to Role
1. Go to: **Setup > Users/Roles > Manage Roles**
2. Edit the role you'll use (or the role mapped to OAuth M2M)

### 4.2 Required Permissions

Navigate to **Permissions** tab > **Setup** subtab:

| Permission | Level | Required |
|------------|-------|----------|
| **Log in using OAuth 2.0 Access Tokens** | Full | ✅ (if using OAuth) |
| **REST Web Services** | Full | ✅ |
| **RESTlets** | Full | ✅ |

Navigate to **Permissions** tab > **Transactions** subtab:

| Permission | Level | Required |
|------------|-------|----------|
| **Project** (Job) | Create, Edit, View | ✅ |
| **Project Task** | Create, Edit, View | ✅ |

Navigate to **Permissions** tab > **Lists** subtab:

| Permission | Level | Notes |
|------------|-------|-------|
| **Customer** | View | For linking projects to customers |
| **Employee** | View | For resource assignment |
| **Service Item** | View | For task service items |
| **Class** | View | For billing class assignment |

**Click Save**

---

## 🧪 Step 5: Test the RESTlet

### 5.1 Test with Postman or cURL

#### Get Your Authentication
- **OAuth 2.0 M2M**: Use the Bearer token from your OAuth implementation
- **TBA**: Generate Authorization header (if still using legacy auth)

#### Test Request

**Endpoint**: `<Your External URL from Step 3.3>`

**Method**: POST

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <your_oauth_token>
```

**Body** (JSON):
```json
{
  "project": {
    "name": "Test Project - Composite RESTlet",
    "entityid": "TEST-COMP-001",
    "customerId": 3161,
    "startDate": "2025-01-15",
    "endDate": "2025-06-30",
    "status": "OPEN",
    "description": "Testing composite creation with rollback"
  },
  "tasks": [
    {
      "name": "Discovery & Planning",
      "plannedWork": 40,
      "estimatedHours": 40,
      "status": "Not Started",
      "resource": "",
      "serviceItem": "PS - Discovery & Design Strategy",
      "billingClass": "1",
      "unitCost": 150
    },
    {
      "name": "Implementation",
      "plannedWork": 120,
      "estimatedHours": 120,
      "status": "Not Started",
      "resource": "",
      "serviceItem": "SVC_PR_Development",
      "billingClass": "1",
      "unitCost": 175
    }
  ]
}
```

#### Expected Response (Success):
```json
{
  "success": true,
  "data": {
    "projectId": 12345,
    "taskIds": [67890, 67891],
    "taskCount": 2,
    "entityid": "TEST-COMP-001"
  },
  "error": null
}
```

#### Expected Response (Failure):
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "TASK_CREATE_FAILED",
    "message": "Failed to create task \"Implementation\": Invalid service item",
    "details": {
      "projectId": 12345,
      "partialTasksCreated": 1,
      "totalTasksRequested": 2
    }
  }
}
```

### 5.2 Verify in NetSuite

After a successful test:

1. Go to: **Lists > Relationships > Projects**
2. Search for: `TEST-COMP-001`
3. Open the project
4. Click **Project Tasks** subtab
5. Verify both tasks were created with correct data

### 5.3 Test Rollback Functionality

To test that rollback works, send a request with an invalid task (e.g., bad service item):

```json
{
  "project": {
    "name": "Rollback Test Project",
    "entityid": "TEST-ROLLBACK-001",
    "customerId": 3161
  },
  "tasks": [
    {
      "name": "Valid Task",
      "plannedWork": 10,
      "serviceItem": "PS - Discovery & Design Strategy"
    },
    {
      "name": "Invalid Task",
      "plannedWork": 10,
      "serviceItem": "INVALID_ITEM_DOES_NOT_EXIST"
    }
  ]
}
```

**Expected Result**:
- RESTlet returns error response
- Project is NOT created (or is deleted if it was partially created)
- No orphaned project records

---

## 🔗 Step 6: Integrate with Your Dashboard

### 6.1 Create API Helper Function

Add to your dashboard codebase:

```javascript
// api/netsuite/composite-project.js

import { netsuiteRequest } from './_oauth-m2m.js';

const RESTLET_URL = process.env.NETSUITE_RESTLET_COMPOSITE_PROJECT_URL;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { project, tasks } = req.body;

    // Validate input
    if (!project || !project.customerId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Missing project or customerId' }
      });
    }

    // Call NetSuite RESTlet
    const response = await netsuiteRequest(RESTLET_URL, {
      method: 'POST',
      body: JSON.stringify({ project, tasks })
    });

    if (!response.ok) {
      throw new Error(`NetSuite returned ${response.status}`);
    }

    const result = await response.json();
    return res.json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'COMPOSITE_CREATE_FAILED',
        message: error.message
      }
    });
  }
}
```

### 6.2 Add Environment Variable

Update your `.env`:
```bash
NETSUITE_RESTLET_COMPOSITE_PROJECT_URL=https://TD3049589.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=123&deploy=1
```

### 6.3 Update Dashboard to Use Composite Endpoint

In `DemoDashboard.jsx`, update the export function:

```javascript
const handleExportProject = async () => {
  if (disabled) return;

  const projectData = {
    name: projectName || `${selectedCustData.name} - Project`,
    entityid: projectCode || `PRJ-${selectedCustData.entityid}-${Date.now()}`,
    customerId: selectedCustData.nsId,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: projectStatus,
    description: `Project Manager: ${projectManager || 'Unassigned'}`
  };

  const taskData = tasks.map((t) => ({
    name: t.name,
    estimatedHours: t.estimatedHours,
    plannedWork: t.plannedWork,
    status: t.status,
    resource: t.resource,
    serviceItem: t.serviceItem,
    billingClass: t.billingClass,
    unitCost: t.unitCost
  }));

  try {
    setActionStatus('Creating project...');

    const response = await fetch('/api/netsuite/composite-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: projectData,
        tasks: taskData
      })
    });

    const result = await response.json();

    if (result.success) {
      setActionStatus(`✓ Project created! ID: ${result.data.projectId}, Tasks: ${result.data.taskCount}`);
      // Clear form or redirect
    } else {
      setActionStatus(`✗ Error: ${result.error.message}`);
    }

    setTimeout(() => setActionStatus(null), 5000);

  } catch (error) {
    setActionStatus(`✗ Failed: ${error.message}`);
    setTimeout(() => setActionStatus(null), 5000);
  }
};
```

---

## 📊 Step 7: Monitor and Optimize

### 7.1 Check Execution Logs

1. Go to: **Customization > Scripting > Script Execution Log**
2. Filter by:
   - Script: `composite_project_create`
   - Type: `RESTlet`
3. Review logs for errors or performance issues

### 7.2 Performance Tuning

If you notice slow performance:

**Check Governance Usage:**
- Each `record.create()` uses ~10 units
- Each `record.save()` uses ~10 units
- Look for `USAGE_LIMIT_EXCEEDED` errors

**Optimization Tips:**
- Limit tasks per request to 20-30 max
- Use dynamic loading (`isDynamic: false`) for better performance
- Consider batching large operations

### 7.3 Change Status to Released

Once testing is complete:

1. Edit the Script Deployment
2. Change **Status** from `Testing` to `Released`
3. Change **Log Level** from `Debug` to `Error`
4. Click **Save**

---

## 🔐 Security Best Practices

### Do's ✅
- Use OAuth 2.0 M2M for authentication
- Restrict deployment to specific roles
- Monitor execution logs regularly
- Use least-privilege role permissions
- Validate all input on both client and server

### Don'ts ❌
- Don't expose RESTlet URL in client-side code
- Don't use admin roles for integrations
- Don't skip input validation
- Don't ignore error responses
- Don't deploy without testing rollback functionality

---

## 🐛 Troubleshooting

### Issue: "Script not found"
**Cause**: Script ID or Deployment ID incorrect in URL
**Fix**: Verify the External URL from the deployment

### Issue: "Permission violation"
**Cause**: Role lacks necessary permissions
**Fix**: Review Step 4 and add missing permissions

### Issue: "Invalid record reference"
**Cause**: Invalid customerId, resource ID, or service item
**Fix**: Validate IDs exist in NetSuite before sending

### Issue: "Task created but project not visible"
**Cause**: Project status set incorrectly
**Fix**: Use valid NetSuite status values (OPEN, IN_PROGRESS, etc.)

### Issue: "Rollback didn't work"
**Cause**: Script error before rollback logic executed
**Fix**: Check Execution Log for the exact error point

---

## ✅ Deployment Checklist

Use this checklist to verify everything is configured:

**File Cabinet**
- [x] Script uploaded to `/SuiteScripts/RESTlets/composite_project_create.js`

**Script Record**
- [x] Script record created
- [x] Status: Testing (change to Released after testing)
- [x] API Version: 2.1

**Deployment**
- [x] Deployment created
- [x] Status: Testing
- [x] External URL copied
- [x] Audience configured (All Roles or specific)

**Permissions**
- [x] Role has REST Web Services permission
- [x] Role has RESTlets permission
- [x] Role has Job (Create, Edit, View)
- [x] Role has ProjectTask (Create, Edit, View)

**Testing**
- [x] Successful test with valid data
- [x] Verified project created in NetSuite
- [x] Verified tasks created correctly
- [x] Tested rollback with invalid data
- [x] Verified no orphaned projects

**Integration**
- [x] API endpoint created in backend
- [x] Environment variable added
- [x] Dashboard updated to use new endpoint
- [x] Error handling implemented

**Production**
- [x] Status changed to Released
- [x] Log Level changed to Error
- [x] Monitoring in place

---

## 📞 Support

If you encounter issues:
1. Check the NetSuite Execution Log
2. Review the [MODERNIZATION_BLUEPRINT.md](MODERNIZATION_BLUEPRINT.md)
3. Verify OAuth 2.0 M2M is configured correctly
4. Test with simple data first, then add complexity

---

**Deployment complete!** You now have atomic project creation with automatic rollback. 🎉

**Next Step**: Integrate with your dashboard UI and start creating projects!
