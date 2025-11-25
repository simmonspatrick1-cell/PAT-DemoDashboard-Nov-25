/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *
 * NetSuite Demo Dashboard Suitelet
 *
 * PURPOSE:
 * Serves the React-based demo dashboard as a native NetSuite application.
 * Eliminates need for external hosting, OAuth, and email exports.
 *
 * BENEFITS:
 * - Native NetSuite authentication (no OAuth needed)
 * - Direct access to NetSuite data
 * - Real-time validation
 * - Single deployment
 * - Users stay within NetSuite context
 *
 * DEPLOYMENT:
 * 1. Build React app: npm run build
 * 2. Upload dist-suitelet/ contents to File Cabinet: /SuiteScripts/Suitelets/Dashboard/
 * 3. Create Script Record from this file
 * 4. Create Deployment
 * 5. Access via Suitelet URL
 */

define(['N/file', 'N/runtime', 'N/url', 'N/log'],
  function(file, runtime, url, log) {

    /**
     * Main Suitelet entry point
     */
    function onRequest(context) {
      try {
        if (context.request.method === 'GET') {
          serveReactApp(context);
        } else {
          // POST/PUT/DELETE can be handled here if needed
          context.response.write(JSON.stringify({
            error: 'Method not allowed'
          }));
        }
      } catch (e) {
        log.error('Suitelet Error', e);
        context.response.write('Error loading dashboard: ' + e.message);
      }
    }

    /**
     * Serve the React application with NetSuite context
     */
    function serveReactApp(context) {
      // Load the built React HTML file
      var htmlFile;

      try {
        htmlFile = file.load({
          id: '/SuiteScripts/Suitelets/Dashboard/index.html'
        });
      } catch (e) {
        log.error('HTML File Load Error', e);
        context.response.write(
          '<html><body>' +
          '<h1>Dashboard Not Found</h1>' +
          '<p>Please upload the React build to /SuiteScripts/Suitelets/Dashboard/</p>' +
          '<p>Error: ' + e.message + '</p>' +
          '</body></html>'
        );
        return;
      }

      var htmlContent = htmlFile.getContents();

      // Get current user and account info
      var currentUser = runtime.getCurrentUser();

      // Build NetSuite context object
      var nsContext = {
        user: {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          roleId: currentUser.roleId,
          subsidiary: currentUser.subsidiary,
          department: currentUser.department,
          location: currentUser.location
        },
        account: {
          id: runtime.accountId,
          type: runtime.envType, // SANDBOX, PRODUCTION, etc.
          version: runtime.version
        },
        // API endpoints for RESTlets
        apiEndpoints: {
          projects: getRESTletUrl('customscript_projects_api', 'customdeploy1'),
          tasks: getRESTletUrl('customscript_tasks_api', 'customdeploy1'),
          composite: getRESTletUrl('customscript_composite_project', 'customdeploy1'),
          customers: getRESTletUrl('customscript_customers_api', 'customdeploy1')
        },
        // Feature flags
        features: {
          aiEnabled: runtime.isFeatureInEffect({ feature: 'CUSTOMRECORD' }), // Use as proxy for custom features
          projectsEnabled: true,
          tasksEnabled: true
        },
        // Timestamp for cache busting
        timestamp: new Date().getTime()
      };

      // Inject NetSuite context into the HTML
      // This makes it available to React via window.NETSUITE_CONTEXT
      var contextScript = '<script>' +
        'window.NETSUITE_CONTEXT = ' + JSON.stringify(nsContext) + ';' +
        'window.NS_ACCOUNT_ID = "' + runtime.accountId + '";' +
        '</script>';

      htmlContent = htmlContent.replace('</head>', contextScript + '</head>');

      // Set content type
      context.response.setHeader({
        name: 'Content-Type',
        value: 'text/html; charset=utf-8'
      });

      // Disable caching for development (remove in production)
      context.response.setHeader({
        name: 'Cache-Control',
        value: 'no-cache, no-store, must-revalidate'
      });

      // Write response
      context.response.write(htmlContent);

      log.audit('Dashboard Served', {
        user: currentUser.name,
        role: currentUser.role
      });
    }

    /**
     * Helper: Get RESTlet URL for API endpoints
     */
    function getRESTletUrl(scriptId, deploymentId) {
      try {
        return url.resolveScript({
          scriptId: scriptId,
          deploymentId: deploymentId,
          returnExternalUrl: false // Internal URL (same domain, no CORS)
        });
      } catch (e) {
        log.debug('RESTlet URL Resolution', 'Could not resolve ' + scriptId + ': ' + e.message);
        return null;
      }
    }

    return {
      onRequest: onRequest
    };
});
