# 🚀 Step-by-Step Deployment Guide - START HERE

**Current Step**: Step 1 - Upload Files to NetSuite
**Estimated Time**: 5 minutes

---

## 📂 Step 1: Upload to NetSuite File Cabinet

### What You'll Do
Upload 4 files from your local computer to NetSuite's File Cabinet.

### Files to Upload (from your computer)

All files are in: `/Users/simmonspatrick1/Documents/GitHub/PAT-DemoDashboard-Nov-25-Clean/`

| # | File to Upload | Size | Location on Your Computer |
|---|----------------|------|---------------------------|
| 1 | `dashboard_suitelet.js` | ~5 KB | `suitescripts/suitelets/dashboard_suitelet.js` |
| 2 | `index.html` | 459 B | `dist-suitelet/index.html` |
| 3 | `dashboard.js` | 567 KB | `dist-suitelet/assets/dashboard.js` |
| 4 | `index.css` | 33 KB | `dist-suitelet/assets/index.css` |

---

### 📋 Detailed Instructions

#### A. Login to NetSuite
1. Open your browser
2. Go to your NetSuite account
3. Login with your credentials

#### B. Navigate to File Cabinet
1. Click **Documents** in the navigation bar
2. Click **Files**
3. Click **File Cabinet**

You should see a list of folders like:
- SuiteScripts
- Web Site Hosting Files
- Templates
- (other folders...)

#### C. Create Folder Structure

**Create Main Folder** (if it doesn't exist):
1. Look for a folder called **SuiteScripts**
2. If it doesn't exist:
   - Click the **New** button
   - Select **Folder**
   - Name: `SuiteScripts`
   - Click **Save**

**Create Suitelets Folder**:
1. Click on **SuiteScripts** to open it
2. Look for a folder called **Suitelets**
3. If it doesn't exist:
   - Click **New** → **Folder**
   - Name: `Suitelets`
   - Click **Save**

**Create Dashboard Folder**:
1. Click on **Suitelets** to open it
2. Click **New** → **Folder**
3. Name: `Dashboard`
4. Click **Save**

**Create assets Folder**:
1. Click on **Dashboard** to open it
2. Click **New** → **Folder**
3. Name: `assets`
4. Click **Save**

**Your folder structure should now be**:
```
/SuiteScripts/Suitelets/Dashboard/
  └── assets/
```

#### D. Upload File #1: dashboard_suitelet.js

1. Navigate to: `/SuiteScripts/Suitelets/Dashboard/`
2. Click the **Upload Files** button
3. Click **Choose File** or **Browse**
4. On your computer, navigate to:
   ```
   /Users/simmonspatrick1/Documents/GitHub/PAT-DemoDashboard-Nov-25-Clean/suitescripts/suitelets/
   ```
5. Select: `dashboard_suitelet.js`
6. Click **Open**
7. In NetSuite:
   - Name: `dashboard_suitelet.js` (should auto-fill)
   - Description: `Suitelet entry point for Demo Dashboard`
   - **Important**: Leave "Replace" unchecked (first upload)
8. Click **Save**

✅ **Verify**: You should see `dashboard_suitelet.js` listed in the Dashboard folder

#### E. Upload File #2: index.html

1. Still in: `/SuiteScripts/Suitelets/Dashboard/`
2. Click **Upload Files** button
3. Click **Choose File**
4. On your computer, navigate to:
   ```
   /Users/simmonspatrick1/Documents/GitHub/PAT-DemoDashboard-Nov-25-Clean/dist-suitelet/
   ```
5. Select: `index.html`
6. Click **Open**
7. In NetSuite:
   - Name: `index.html`
   - Description: `React app entry point`
8. Click **Save**

✅ **Verify**: You should see both `dashboard_suitelet.js` and `index.html` in the Dashboard folder

#### F. Upload File #3: dashboard.js

1. Navigate to: `/SuiteScripts/Suitelets/Dashboard/assets/`
   - Click on the **assets** folder to open it
2. Click **Upload Files** button
3. Click **Choose File**
4. On your computer, navigate to:
   ```
   /Users/simmonspatrick1/Documents/GitHub/PAT-DemoDashboard-Nov-25-Clean/dist-suitelet/assets/
   ```
5. Select: `dashboard.js` (this is the large 567 KB file)
6. Click **Open**
7. In NetSuite:
   - Name: `dashboard.js`
   - Description: `React application bundle`
8. Click **Save**
9. **Wait for upload** (this file is larger, may take 10-30 seconds)

✅ **Verify**: You should see `dashboard.js` in the assets folder

#### G. Upload File #4: index.css

1. Still in: `/SuiteScripts/Suitelets/Dashboard/assets/`
2. Click **Upload Files** button
3. Click **Choose File**
4. On your computer, navigate to:
   ```
   /Users/simmonspatrick1/Documents/GitHub/PAT-DemoDashboard-Nov-25-Clean/dist-suitelet/assets/
   ```
5. Select: `index.css`
6. Click **Open**
7. In NetSuite:
   - Name: `index.css`
   - Description: `Dashboard styles`
8. Click **Save**

✅ **Verify**: You should see both `dashboard.js` and `index.css` in the assets folder

---

### ✅ Step 1 Complete - Verification

Your File Cabinet should now look like this:

```
/SuiteScripts/Suitelets/Dashboard/
  ├── dashboard_suitelet.js  ✅
  ├── index.html             ✅
  └── assets/
      ├── dashboard.js       ✅
      └── index.css          ✅
```

**Verify all 4 files are uploaded**:
1. Navigate to `/SuiteScripts/Suitelets/Dashboard/`
2. You should see:
   - dashboard_suitelet.js
   - index.html
   - assets (folder)
3. Click on **assets**
4. You should see:
   - dashboard.js
   - index.css

---

## ➡️ Next Step: Create Script Record

Now that files are uploaded, you need to create a Script Record.

**When you're ready, let me know and I'll guide you through Step 2!**

---

## 🆘 Troubleshooting Step 1

### Issue: Can't find File Cabinet
- **Solution**: Click **Documents** → **Files** → **File Cabinet**

### Issue: Don't have permission to create folders
- **Solution**: You need Administrator or Developer role. Contact your NetSuite admin.

### Issue: Upload fails or times out
- **Solution**:
  - Check your internet connection
  - Try a smaller file first (index.html)
  - The dashboard.js file is 567 KB, may take 30-60 seconds

### Issue: Can't find files on my computer
- **Solution**: Files are in:
  - Suitelet: `/Users/simmonspatrick1/Documents/GitHub/PAT-DemoDashboard-Nov-25-Clean/suitescripts/suitelets/dashboard_suitelet.js`
  - Build files: `/Users/simmonspatrick1/Documents/GitHub/PAT-DemoDashboard-Nov-25-Clean/dist-suitelet/`

---

**Status**: ⏸️ Waiting for Step 1 completion
**Next**: Step 2 - Create Script Record
