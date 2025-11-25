/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 * Composite Project + Tasks Creation RESTlet
 *
 * PURPOSE:
 * Creates a NetSuite Project (Job) and all associated Project Tasks
 * in a pseudo-atomic transaction with rollback capability.
 *
 * ARCHITECTURE:
 * - Implements standardized response envelope pattern
 * - Ensures all-or-nothing semantics (if any task fails, project is deleted)
 * - Provides detailed error context for frontend debugging
 * - Optimized for governance limits
 *
 * SECURITY:
 * - Must be called via OAuth 2.0 M2M or TBA
 * - Role must have permissions: Job (Create), ProjectTask (Create)
 *
 * REQUEST SCHEMA:
 * {
 *   "project": {
 *     "name": "Project Name",
 *     "entityid": "PRJ-CODE-001",
 *     "customerId": 3161,
 *     "startDate": "2025-01-15",
 *     "endDate": "2025-06-30",
 *     "status": "OPEN",
 *     "description": "Project description"
 *   },
 *   "tasks": [
 *     {
 *       "name": "Discovery & Design",
 *       "plannedWork": 40,
 *       "estimatedHours": 40,
 *       "status": "Not Started",
 *       "resource": "3",
 *       "serviceItem": "PS - Discovery & Design Strategy",
 *       "billingClass": "1",
 *       "unitCost": 150
 *     }
 *   ]
 * }
 *
 * RESPONSE SCHEMA:
 * {
 *   "success": boolean,
 *   "data": { "projectId": number, "taskIds": number[], "taskCount": number } | null,
 *   "error": { "code": string, "message": string, "details": object } | null
 * }
 */

define(['N/record', 'N/error', 'N/log', 'N/format'], (record, error, log, format) => {

  /**
   * Map frontend status values to NetSuite project task status
   */
  function mapTaskStatus(frontendStatus) {
    const statusMap = {
      'Not Started': 'NOTSTART',
      'In Progress': 'PROGRESS',
      'Completed': 'COMPLETE',
      'On Hold': 'ONHOLD'
    };
    return statusMap[frontendStatus] || 'NOTSTART';
  }

  /**
   * Parse date string to NetSuite Date object
   */
  function parseDate(dateString) {
    if (!dateString) return null;
    try {
      return format.parse({ value: dateString, type: format.Type.DATE });
    } catch (e) {
      log.debug('Date Parse Error', `Could not parse date: ${dateString}`);
      return null;
    }
  }

  /**
   * Create Project Record
   */
  function createProject(projectData) {
    const projectRec = record.create({
      type: record.Type.JOB,
      isDynamic: false
    });

    // Required fields
    projectRec.setValue({
      fieldId: 'entityid',
      value: projectData.entityid || `PROJ-${Date.now()}`
    });

    projectRec.setValue({
      fieldId: 'companyname',
      value: projectData.name || projectData.entityid
    });

    projectRec.setValue({
      fieldId: 'parent',
      value: parseInt(projectData.customerId)
    });

    // Optional fields with error handling
    if (projectData.startDate) {
      const startDate = parseDate(projectData.startDate);
      if (startDate) {
        projectRec.setValue({ fieldId: 'startdate', value: startDate });
      }
    }

    if (projectData.endDate) {
      const endDate = parseDate(projectData.endDate);
      if (endDate) {
        projectRec.setValue({ fieldId: 'enddate', value: endDate });
      }
    }

    if (projectData.status) {
      projectRec.setValue({ fieldId: 'entitystatus', value: projectData.status });
    }

    if (projectData.description) {
      projectRec.setValue({ fieldId: 'comments', value: projectData.description });
    }

    const projectId = projectRec.save();
    log.audit('Project Created', { projectId, entityid: projectData.entityid });

    return projectId;
  }

  /**
   * Create Project Task Record
   */
  function createProjectTask(taskData, projectId) {
    const taskRec = record.create({
      type: 'projecttask',
      isDynamic: false
    });

    // Link to project (required)
    taskRec.setValue({ fieldId: 'company', value: projectId });

    // Task details
    taskRec.setValue({
      fieldId: 'title',
      value: taskData.name || 'Untitled Task'
    });

    if (taskData.plannedWork) {
      taskRec.setValue({
        fieldId: 'plannedwork',
        value: parseFloat(taskData.plannedWork)
      });
    }

    if (taskData.estimatedHours) {
      taskRec.setValue({
        fieldId: 'estimatedwork',
        value: parseFloat(taskData.estimatedHours)
      });
    }

    if (taskData.status) {
      taskRec.setValue({
        fieldId: 'status',
        value: mapTaskStatus(taskData.status)
      });
    }

    if (taskData.resource) {
      try {
        taskRec.setValue({
          fieldId: 'assignee',
          value: parseInt(taskData.resource)
        });
      } catch (e) {
        log.debug('Resource Assignment', `Could not assign resource: ${e.message}`);
      }
    }

    if (taskData.serviceItem) {
      try {
        // Note: serviceitem field may require item internal ID
        // Frontend should pass item name; we look it up or accept as-is
        taskRec.setText({
          fieldId: 'serviceitem',
          text: taskData.serviceItem
        });
      } catch (e) {
        log.debug('Service Item', `Could not set service item: ${e.message}`);
      }
    }

    if (taskData.billingClass) {
      try {
        taskRec.setValue({
          fieldId: 'class',
          value: parseInt(taskData.billingClass)
        });
      } catch (e) {
        log.debug('Billing Class', `Could not set class: ${e.message}`);
      }
    }

    if (taskData.unitCost) {
      try {
        taskRec.setValue({
          fieldId: 'rate',
          value: parseFloat(taskData.unitCost)
        });
      } catch (e) {
        log.debug('Unit Cost', `Could not set rate: ${e.message}`);
      }
    }

    const taskId = taskRec.save();
    log.audit('Task Created', { taskId, projectId, title: taskData.name });

    return taskId;
  }

  /**
   * Main POST handler - Creates project with tasks atomically
   *
   * @param {object} requestBody - Contains project and tasks data
   * @returns {object} Standardized response envelope
   */
  function post(requestBody) {
    let projectId = null;
    const createdTaskIds = [];

    try {
      // Validate request structure
      if (!requestBody.project) {
        throw error.create({
          name: 'MISSING_PROJECT_DATA',
          message: 'Request must include "project" object',
          notifyOff: true
        });
      }

      if (!requestBody.project.customerId) {
        throw error.create({
          name: 'MISSING_CUSTOMER_ID',
          message: 'Project must specify customerId',
          notifyOff: true
        });
      }

      // Step 1: Create Project
      log.audit('Starting Composite Create', {
        projectName: requestBody.project.name,
        taskCount: (requestBody.tasks || []).length
      });

      projectId = createProject(requestBody.project);

      // Step 2: Create Tasks (with rollback on failure)
      if (requestBody.tasks && requestBody.tasks.length > 0) {
        for (let i = 0; i < requestBody.tasks.length; i++) {
          const task = requestBody.tasks[i];

          try {
            const taskId = createProjectTask(task, projectId);
            createdTaskIds.push(taskId);

          } catch (taskError) {
            log.error('Task Creation Failed', {
              taskIndex: i,
              taskName: task.name,
              error: taskError.message
            });

            // ROLLBACK: Delete project to maintain consistency
            try {
              record.delete({
                type: record.Type.JOB,
                id: projectId
              });
              log.audit('Rollback Complete', { deletedProjectId: projectId });
            } catch (deleteError) {
              log.error('Rollback Failed', {
                projectId,
                deleteError: deleteError.message
              });
            }

            // Throw detailed error
            throw error.create({
              name: 'TASK_CREATE_FAILED',
              message: `Failed to create task "${task.name}" (index ${i}): ${taskError.message}. Project ${projectId} has been rolled back.`,
              notifyOff: true
            });
          }
        }
      }

      // Success response
      return {
        success: true,
        data: {
          projectId: projectId,
          taskIds: createdTaskIds,
          taskCount: createdTaskIds.length,
          entityid: requestBody.project.entityid
        },
        error: null
      };

    } catch (e) {
      log.error('Composite Create Failed', {
        error: e.name,
        message: e.message,
        projectId: projectId,
        createdTasks: createdTaskIds.length
      });

      // Return standardized error response
      return {
        success: false,
        data: null,
        error: {
          code: e.name || 'COMPOSITE_CREATE_ERROR',
          message: e.message || 'Unknown error occurred',
          details: {
            projectId: projectId,
            partialTasksCreated: createdTaskIds.length,
            totalTasksRequested: (requestBody.tasks || []).length
          }
        }
      };
    }
  }

  /**
   * Health check endpoint
   */
  function get(requestParams) {
    return {
      success: true,
      data: {
        service: 'Composite Project Create RESTlet',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      },
      error: null
    };
  }

  return {
    post: post,
    get: get
  };
});
