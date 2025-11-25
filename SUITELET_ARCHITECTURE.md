# Suitelet Architecture - Native NetSuite React Dashboard

## 🎯 Overview

Instead of hosting the React app externally and using email/JSON exports, we can **embed the entire React application as a Suitelet** inside NetSuite. This eliminates the need for OAuth, email exports, and external authentication.

---

## 📊 Architecture Comparison

### Current External Architecture
```
┌─────────────────┐
│  Vercel/Server  │
│   React App     │
└────────┬────────┘
         │ OAuth 2.0
         │ RESTlets/REST API
         ↓
┌─────────────────┐
│   NetSuite      │
│   - Records     │
│   - Data        │
└─────────────────┘

Issues:
- Complex OAuth setup
- Email/JSON exports
- External hosting costs
- Authentication overhead
```

### Proposed Suitelet Architecture
```
┌─────────────────────────────────────┐
│           NetSuite                  │
│  ┌──────────────────────────────┐   │
│  │  Suitelet (Entry Point)      │   │
│  │  - Serves React bundle       │   │
│  │  - Handles authentication    │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────▼───────────────────┐   │
│  │  React App (Bundled JS)      │   │
│  │  - All dashboard components  │   │
│  │  - Runs in browser           │   │
│  └──────────┬───────────────────┘   │
│             │                        │
│  ┌──────────▼───────────────────┐   │
│  │  RESTlet APIs                │   │
│  │  - Project CRUD              │   │
│  │  - Task management           │   │
│  │  - Direct N/record access    │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘

Benefits:
- No external hosting
- Native authentication
- Direct database access
- Single deployment
```

---

## 🛠️ Implementation Steps

### Phase 1: Build React as Static Bundle

#### 1.1 Update Vite Config
Create/update `vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-suitelet',
    rollupOptions: {
      output: {
        // Single file output for easier NetSuite hosting
        manualChunks: undefined,
        entryFileNames: 'assets/dashboard.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    // Inline small assets
    assetsInlineLimit: 4096
  },
  base: './' // Relative paths for NetSuite hosting
});
```

#### 1.2 Build React App
```bash
npm run build

# Output: dist-suitelet/
#   - index.html
#   - assets/dashboard.js
#   - assets/dashboard.css
```

### Phase 2: Create Suitelet Entry Point

#### 2.1 Create Main Suitelet
**File**: `suitescripts/suitelets/dashboard_suitelet.js`

```javascript
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * NetSuite Demo Dashboard Suitelet
 *
 * Serves the React application with native NetSuite authentication
 */

define(['N/file', 'N/ui/serverWidget', 'N/runtime'],
  function(file, serverWidget, runtime) {

    /**
     * GET: Serve the React application
     */
    function onRequest(context) {
      if (context.request.method === 'GET') {

        // Load the built React HTML
        var htmlFile = file.load({
          id: '/SuiteScripts/Suitelets/Dashboard/index.html'
        });

        var htmlContent = htmlFile.getContents();

        // Inject NetSuite context into the page
        var nsContext = {
          user: {
            id: runtime.getCurrentUser().id,
            name: runtime.getCurrentUser().name,
            email: runtime.getCurrentUser().email,
            role: runtime.getCurrentUser().role
          },
          account: {
            id: runtime.accountId,
            type: runtime.envType
          },
          // API endpoints for RESTlets
          apiEndpoints: {
            projects: getScriptUrl('customscript_projects_api', 'customdeploy1'),
            tasks: getScriptUrl('customscript_tasks_api', 'customdeploy1'),
            composite: getScriptUrl('customscript_composite_project', 'customdeploy1')
          }
        };

        // Inject context as global variable
        htmlContent = htmlContent.replace(
          '</head>',
          '<script>window.NETSUITE_CONTEXT = ' +
          JSON.stringify(nsContext) +
          ';</script></head>'
        );

        // Serve the page
        context.response.write(htmlContent);

      } else {
        // Handle POST requests (if needed)
        context.response.write(JSON.stringify({
          error: 'Method not allowed'
        }));
      }
    }

    /**
     * Helper: Get RESTlet URL
     */
    function getScriptUrl(scriptId, deploymentId) {
      var url = require('N/url');
      return url.resolveScript({
        scriptId: scriptId,
        deploymentId: deploymentId,
        returnExternalUrl: false
      });
    }

    return {
      onRequest: onRequest
    };
});
```

#### 2.2 Update React to Use NetSuite Context

**File**: `src/main.jsx`

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import DemoDashboard from './DemoDashboard';
import './index.css';

// Get NetSuite context injected by Suitelet
const nsContext = window.NETSUITE_CONTEXT || {};

// Create API client that uses NetSuite's built-in authentication
const netsuiteAPI = {
  baseUrl: '', // Same domain, no CORS

  async call(endpoint, options = {}) {
    const url = nsContext.apiEndpoints?.[endpoint] || endpoint;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
        // No Authorization header needed - NetSuite session handles it
      }
    });

    return response.json();
  },

  // Convenience methods
  getProjects: (customerId) =>
    netsuiteAPI.call('projects', {
      method: 'POST',
      body: JSON.stringify({ customerId })
    }),

  createProject: (project, tasks) =>
    netsuiteAPI.call('composite', {
      method: 'POST',
      body: JSON.stringify({ project, tasks })
    })
};

// Pass context to app
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DemoDashboard
      netsuiteContext={nsContext}
      api={netsuiteAPI}
    />
  </React.StrictMode>
);
```

### Phase 3: Update Dashboard to Use Native APIs

**File**: `DemoDashboard.jsx`

```javascript
export default function DemoDashboard({ netsuiteContext, api }) {
  // Access current user
  const currentUser = netsuiteContext.user;

  // No more OAuth needed!
  const handleExportProject = async () => {
    setActionStatus('Creating project...');

    try {
      // Direct API call - no email export!
      const result = await api.createProject(projectData, tasks);

      if (result.success) {
        setActionStatus(`✓ Project created! ID: ${result.data.projectId}`);

        // Open the project in NetSuite
        const projectUrl = `/app/accounting/project/project.nl?id=${result.data.projectId}`;
        window.open(projectUrl, '_blank');
      } else {
        setActionStatus(`✗ Error: ${result.error.message}`);
      }
    } catch (error) {
      setActionStatus(`✗ Failed: ${error.message}`);
    }
  };

  return (
    <div className="dashboard">
      {/* Show current NetSuite user */}
      <div className="user-info">
        Logged in as: {currentUser.name} ({currentUser.email})
      </div>

      {/* Rest of dashboard */}
      {/* ... */}
    </div>
  );
}
```

### Phase 4: Deploy to NetSuite

#### 4.1 Upload Files to File Cabinet
```
/SuiteScripts/Suitelets/Dashboard/
  ├── dashboard_suitelet.js (entry point)
  ├── index.html (built React)
  ├── assets/
  │   ├── dashboard.js
  │   └── dashboard.css
```

#### 4.2 Create Script Record
1. **Customization > Scripting > Scripts > New**
2. Select: `dashboard_suitelet.js`
3. Save

#### 4.3 Create Deployment
1. **New Deployment**
2. Status: Released
3. Audience: Employees, Administrators (whoever needs access)
4. **Copy the URL** - this is your dashboard URL!

#### 4.4 Add to NetSuite Menu (Optional)
1. **Setup > Company > Setup Tasks**
2. Add link to Suitelet URL
3. Users can access from NetSuite navigation

---

## ✅ Benefits of Suitelet Architecture

### 1. **No External Authentication**
```javascript
// Before: Complex OAuth
const token = await getOAuthToken();
fetch(url, { headers: { Authorization: `Bearer ${token}` }});

// After: Uses NetSuite session
fetch(url); // Just works!
```

### 2. **Direct Database Access**
RESTlets can directly use:
- `N/record.load()` - No API calls needed
- `N/search.create()` - Real-time data
- `N/query.runSuiteQL()` - Optimized queries

### 3. **Real-Time Validation**
```javascript
// Validate customer exists before submission
const customerExists = search.lookupFields({
  type: 'customer',
  id: customerId,
  columns: ['entityid']
});

if (!customerExists) {
  return { success: false, error: 'Customer not found' };
}
```

### 4. **Single Deployment**
- No Vercel hosting
- No environment variables to manage
- No CORS issues
- Update once, all users get new version

### 5. **Native NetSuite Integration**
```javascript
// Open created project in NetSuite
window.location.href = `/app/accounting/project/project.nl?id=${projectId}`;

// Trigger NetSuite workflows
record.submitFields({
  type: 'job',
  id: projectId,
  values: { entitystatus: 'IN_PROGRESS' }
});
```

---

## 🚀 Migration Path

### Option 1: Full Migration (Recommended)
1. Build React as Suitelet (Steps above)
2. Deploy to NetSuite
3. Deprecate external dashboard
4. Remove OAuth complexity

### Option 2: Hybrid Approach
1. Keep external dashboard for public demos
2. Deploy Suitelet for internal users
3. Share RESTlet APIs between both

### Option 3: Progressive Enhancement
1. Start with Suitelet serving static HTML
2. Add React components incrementally
3. Migrate features one-by-one

---

## 📝 Code Organization

### Recommended Structure
```
suitescripts/
  ├── suitelets/
  │   └── dashboard/
  │       ├── dashboard_suitelet.js (entry point)
  │       ├── index.html (React build)
  │       └── assets/
  │           ├── dashboard.js
  │           └── dashboard.css
  │
  └── restlets/
      ├── projects_api.js (CRUD for projects)
      ├── tasks_api.js (CRUD for tasks)
      └── composite_project_create.js (atomic operations)
```

---

## 🎨 Enhanced Capabilities with Suitelet

### 1. **Use NetSuite UI Components**
```javascript
// Add NetSuite-styled buttons
var form = serverWidget.createForm({ title: 'Project Dashboard' });
form.addButton({
  id: 'custpage_create_project',
  label: 'Create Project',
  functionName: 'createProject()'
});
```

### 2. **Access Saved Searches Directly**
```javascript
// No API call needed
var projectSearch = search.load({ id: 'customsearch_projects' });
var results = projectSearch.run().getRange({ start: 0, end: 100 });
```

### 3. **Trigger Workflows**
```javascript
// Submit record to trigger workflows
record.submitFields({
  type: 'job',
  id: projectId,
  values: { custbody_trigger_workflow: true }
});
```

### 4. **Real-Time Lookups**
```javascript
// Validate in RESTlet before creating
const itemExists = search.lookupFields({
  type: 'serviceitem',
  id: serviceItemId,
  columns: ['itemid', 'displayname']
});
```

---

## 🔐 Security Benefits

### Native NetSuite Permissions
- ✅ Users must be logged into NetSuite
- ✅ Role permissions apply automatically
- ✅ Record-level security enforced
- ✅ No exposed API keys
- ✅ Audit trail built-in

### Example Permission Check
```javascript
// In RESTlet
var currentUser = runtime.getCurrentUser();
var userRole = currentUser.role;

if (userRole !== 'administrator' && userRole !== 'project_manager') {
  return {
    success: false,
    error: { code: 'PERMISSION_DENIED', message: 'Insufficient permissions' }
  };
}
```

---

## 🎯 Quick Start Guide

### 1. Build React Bundle
```bash
cd /Users/simmonspatrick1/Documents/GitHub/PAT-DemoDashboard-Nov-25-Clean

# Build for Suitelet
npm run build

# Output in dist-suitelet/
```

### 2. Create Suitelet Script
Copy `dashboard_suitelet.js` template above

### 3. Upload to NetSuite
Upload entire `dist-suitelet/` folder to File Cabinet

### 4. Deploy
Create Script Record and Deployment

### 5. Access
Navigate to Suitelet URL - Dashboard loads with native auth!

---

## 💡 Bottom Line

**Your suggestion is 100% correct.** The Suitelet architecture is:
- ✅ **Simpler** - No OAuth complexity
- ✅ **Faster** - No external API calls
- ✅ **Cheaper** - No hosting costs
- ✅ **More Secure** - Native NetSuite auth
- ✅ **Better UX** - Users stay in NetSuite

**Should we proceed with building this?** I can:
1. Create the Suitelet entry point
2. Configure the build for NetSuite hosting
3. Create deployment instructions
4. Migrate the dashboard to use native APIs

This is definitely the right architectural direction!
