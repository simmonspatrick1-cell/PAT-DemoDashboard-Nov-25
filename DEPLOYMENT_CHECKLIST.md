# 🚀 Suitelet Deployment Checklist

**Status**: Ready for Deployment
**Build Date**: November 25, 2025
**Build Output**: dist-suitelet/

---

## ✅ Pre-Deployment Verification

- [x] React app built successfully
- [x] Build output verified:
  - [x] index.html (459 B)
  - [x] assets/dashboard.js (567 KB)
  - [x] assets/index.css (33 KB)
- [x] Suitelet entry point created: `suitescripts/suitelets/dashboard_suitelet.js`
- [x] Composite RESTlet ready: `suitescripts/restlets/composite_project_create.js`
- [x] Deployment guide created: `SUITELET_DEPLOYMENT.md`

---

## 📋 Deployment Steps

### Step 1: Upload to NetSuite File Cabinet
⏱️ Estimated Time: 5 minutes

#### 1.1 Create Folder Structure
- [ ] Login to NetSuite
- [ ] Navigate to: Documents > Files > File Cabinet
- [ ] Create: `/SuiteScripts/` (if not exists)
- [ ] Create: `/SuiteScripts/Suitelets/`
- [ ] Create: `/SuiteScripts/Suitelets/Dashboard/`
- [ ] Create: `/SuiteScripts/Suitelets/Dashboard/assets/`

#### 1.2 Upload Suitelet Entry Point
- [ ] Navigate to: `/SuiteScripts/Suitelets/Dashboard/`
- [ ] Upload: `suitescripts/suitelets/dashboard_suitelet.js`
  - **Source**: `PAT-DemoDashboard-Nov-25-Clean/suitescripts/suitelets/dashboard_suitelet.js`
  - **Destination**: `/SuiteScripts/Suitelets/Dashboard/dashboard_suitelet.js`

#### 1.3 Upload React Build Files
- [ ] Upload: `dist-suitelet/index.html`
  - **Source**: `PAT-DemoDashboard-Nov-25-Clean/dist-suitelet/index.html`
  - **Destination**: `/SuiteScripts/Suitelets/Dashboard/index.html`

- [ ] Upload: `dist-suitelet/assets/dashboard.js`
  - **Source**: `PAT-DemoDashboard-Nov-25-Clean/dist-suitelet/assets/dashboard.js`
  - **Destination**: `/SuiteScripts/Suitelets/Dashboard/assets/dashboard.js`

- [ ] Upload: `dist-suitelet/assets/index.css`
  - **Source**: `PAT-DemoDashboard-Nov-25-Clean/dist-suitelet/assets/index.css`
  - **Destination**: `/SuiteScripts/Suitelets/Dashboard/assets/index.css`

#### 1.4 Upload Composite RESTlet (Optional - for full functionality)
- [ ] Create: `/SuiteScripts/RESTlets/` (if not exists)
- [ ] Upload: `suitescripts/restlets/composite_project_create.js`
  - **Source**: `PAT-DemoDashboard-Nov-25-Clean/suitescripts/restlets/composite_project_create.js`
  - **Destination**: `/SuiteScripts/RESTlets/composite_project_create.js`

---

### Step 2: Create Script Record for Suitelet
⏱️ Estimated Time: 2 minutes

- [ ] Navigate to: Customization > Scripting > Scripts
- [ ] Click: **New**
- [ ] Select Script File: `/SuiteScripts/Suitelets/Dashboard/dashboard_suitelet.js`
- [ ] Verify Auto-Populated Details:
  - **Name**: NetSuite Demo Dashboard Suitelet
  - **ID**: `customscript_dashboard_suitelet` (auto-generated)
  - **API Version**: 2.1
  - **Script Type**: Suitelet
- [ ] Click: **Save**

---

### Step 3: Create Deployment for Suitelet
⏱️ Estimated Time: 2 minutes

- [ ] On Script Details page, click: **Deployments** subtab
- [ ] Click: **New Deployment**
- [ ] Configure:
  - **Title**: `Demo Dashboard - Production`
  - **ID**: `customdeploy_dashboard_prod` (auto-generated)
  - **Status**: Released
  - **Log Level**: Error (or Debug for initial testing)
- [ ] Set Audience:
  - **Select**: All Roles (or choose specific roles)
- [ ] Verify Execution Context:
  - [x] User Interface (should be auto-checked)
- [ ] Click: **Save**
- [ ] **Copy External URL** from deployment page
  - URL Format: `https://XXXXXX.app.netsuite.com/app/site/hosting/scriptlet.nl?script=XXX&deploy=X`
  - **Record URL here**: ___________________________________

---

### Step 4: Test Suitelet (Without RESTlets)
⏱️ Estimated Time: 3 minutes

- [ ] Open External URL in browser
- [ ] Verify Dashboard Loads:
  - [ ] Dashboard displays in NetSuite
  - [ ] NetSuite navigation bar visible at top
  - [ ] User name displayed correctly
  - [ ] No JavaScript errors in console (F12)
- [ ] Check Browser Console (F12):
  - [ ] `window.NETSUITE_CONTEXT` object exists
  - [ ] User info populated correctly
  - [ ] Account info present
- [ ] Check NetSuite Execution Log:
  - Navigate to: Customization > Scripting > Script Execution Log
  - Filter by: `customscript_dashboard_suitelet`
  - [ ] Verify "Dashboard Served" audit log entry
  - [ ] No error entries

**Expected Behavior at This Stage**:
- ✅ Dashboard loads and displays
- ✅ UI is functional
- ⚠️ API calls will fail (RESTlets not deployed yet)
- ⚠️ Project creation will not work yet

---

### Step 5: Deploy Composite RESTlet (Optional - for Full Functionality)
⏱️ Estimated Time: 5 minutes

#### 5.1 Create Script Record for RESTlet
- [ ] Navigate to: Customization > Scripting > Scripts
- [ ] Click: **New**
- [ ] Select Script File: `/SuiteScripts/RESTlets/composite_project_create.js`
- [ ] Verify Details:
  - **Name**: Composite Project Creator
  - **ID**: `customscript_composite_project` (auto-generated)
  - **API Version**: 2.1
  - **Script Type**: RESTlet
- [ ] Click: **Save**

#### 5.2 Create Deployment for RESTlet
- [ ] Click: **Deployments** subtab
- [ ] Click: **New Deployment**
- [ ] Configure:
  - **Title**: `Composite Project API - Production`
  - **ID**: `customdeploy_composite_prod` (or `customdeploy1`)
  - **Status**: Released
  - **Log Level**: Error
- [ ] Set Audience: All Roles
- [ ] Click: **Save**
- [ ] **Record Deployment ID**: ___________________________________

#### 5.3 Update Suitelet with RESTlet Script IDs
- [ ] Navigate to: Documents > Files > File Cabinet
- [ ] Open: `/SuiteScripts/Suitelets/Dashboard/dashboard_suitelet.js`
- [ ] Click: **Edit**
- [ ] Find line ~96-99 (apiEndpoints section)
- [ ] Update script IDs with actual deployed IDs:
  ```javascript
  apiEndpoints: {
    projects: getRESTletUrl('customscript_projects_api', 'customdeploy1'),
    tasks: getRESTletUrl('customscript_tasks_api', 'customdeploy1'),
    composite: getRESTletUrl('customscript_composite_project', 'YOUR_DEPLOYMENT_ID'),
    customers: getRESTletUrl('customscript_customers_api', 'customdeploy1')
  }
  ```
- [ ] Click: **Save**

---

### Step 6: Test Full Functionality
⏱️ Estimated Time: 5 minutes

- [ ] Refresh dashboard in browser (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] Test Project Creation:
  - [ ] Fill out project form
  - [ ] Add 2-3 tasks with all fields
  - [ ] Click "Export to NetSuite"
  - [ ] Verify success message with Project ID
- [ ] Verify in NetSuite:
  - [ ] Navigate to: Lists > Relationships > Projects
  - [ ] Find created project
  - [ ] Open project record
  - [ ] Verify all fields populated correctly
  - [ ] Check Project Tasks subtab
  - [ ] Verify all tasks created with correct data

---

## 🎯 Post-Deployment Tasks

### Optional: Add to NetSuite Navigation

#### Method 1: Add to Shortcuts
- [ ] Open Suitelet URL
- [ ] Click: ⭐ **Add to Shortcuts**
- [ ] Dashboard now accessible from shortcuts bar

#### Method 2: Add to Custom Tab
- [ ] Home > Customize Dashboard
- [ ] Setup > Add Content > Custom Link
- [ ] Configure:
  - Label: `Demo Dashboard`
  - URL: `<Your Suitelet URL>`
- [ ] Save

#### Method 3: Add to Center Links
- [ ] Setup > Company > Setup Tasks
- [ ] Add Link:
  - Name: `Demo Dashboard`
  - URL: `<Your Suitelet URL>`
  - Description: `NetSuite Demo Dashboard`

---

## 📊 Success Metrics

After deployment is complete, you should have:

- ✅ Native NetSuite dashboard (no external hosting)
- ✅ Built-in authentication (no OAuth needed)
- ✅ Direct API access (no email exports)
- ✅ Single deployment model
- ✅ Real-time data validation
- ✅ Professional React interface

---

## 🐛 Troubleshooting

### Issue: Dashboard shows blank screen
**Check**:
1. Browser Network tab - Are assets loading?
2. File paths in File Cabinet match exactly
3. All 4 files uploaded (index.html + 3 in assets/)

### Issue: "File not found" error
**Check**:
1. Verify path in dashboard_suitelet.js line 58 matches File Cabinet
2. Check case sensitivity (NetSuite paths are case-sensitive)

### Issue: API calls failing
**Expected until Step 5 is complete**
- RESTlets must be deployed separately
- Update apiEndpoints in dashboard_suitelet.js with actual script IDs

### Issue: Permission denied
**Check**:
1. Deployment Audience settings
2. User role has Suitelet permissions
3. Script deployment is Released (not Testing)

---

## 📞 Support Resources

- **Architecture Guide**: [SUITELET_ARCHITECTURE.md](SUITELET_ARCHITECTURE.md)
- **Detailed Instructions**: [SUITELET_DEPLOYMENT.md](SUITELET_DEPLOYMENT.md)
- **Modernization Blueprint**: [MODERNIZATION_BLUEPRINT.md](MODERNIZATION_BLUEPRINT.md)

---

## ✅ Final Verification

Once all steps are complete:

**File Cabinet**:
- [x] Build files ready in dist-suitelet/
- [ ] All files uploaded to NetSuite
- [ ] File paths verified

**Script Records**:
- [ ] Suitelet script created
- [ ] RESTlet script created (optional)

**Deployments**:
- [ ] Suitelet deployed and Released
- [ ] RESTlet deployed and Released (optional)
- [ ] External URLs recorded

**Testing**:
- [ ] Dashboard loads successfully
- [ ] User context displays correctly
- [ ] No console errors
- [ ] Project creation works (if RESTlet deployed)

---

**Deployment Status**: ⏳ Ready to Deploy

**Next Action**: Follow Step 1 - Upload files to NetSuite File Cabinet

**Estimated Total Time**: 15-20 minutes (without RESTlet) or 20-25 minutes (with RESTlet)
