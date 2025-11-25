/**
 * AI-Powered Synthetic Test Data Generator
 *
 * Generates realistic NetSuite project and task data using Claude AI
 * with structured outputs for guaranteed schema compliance.
 *
 * Features:
 * - Foreign key integrity (uses only valid Customer/Item IDs)
 * - Industry-specific context awareness
 * - Variance in data (mix of project sizes, budgets, team sizes)
 * - JSON Schema enforcement for zero parsing errors
 *
 * @see Part IV Section 4.1 of Modernization Blueprint
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Project with Tasks JSON Schema
 * This ensures Claude generates data that exactly matches our data model
 */
const PROJECT_SCHEMA = {
  type: 'object',
  required: ['records'],
  properties: {
    records: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'entityid', 'customerId', 'tasks'],
        properties: {
          name: { type: 'string' },
          entityid: { type: 'string' },
          customerId: { type: 'number' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          budget: { type: 'number' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'CLOSED'] },
          description: { type: 'string' },
          tasks: {
            type: 'array',
            minItems: 3,
            maxItems: 12,
            items: {
              type: 'object',
              required: ['name', 'plannedWork', 'serviceItem', 'billingClass', 'unitCost'],
              properties: {
                name: { type: 'string' },
                plannedWork: { type: 'number', minimum: 1, maximum: 500 },
                estimatedHours: { type: 'number', minimum: 1, maximum: 500 },
                status: { type: 'string', enum: ['Not Started', 'In Progress', 'Completed', 'On Hold'] },
                resource: { type: 'string' },
                serviceItem: { type: 'string' },
                billingClass: { type: 'string' },
                unitCost: { type: 'number', minimum: 50, maximum: 300 }
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Generate synthetic test data
 *
 * @param {object} params - Generation parameters
 * @returns {Promise<object>} Generated records
 */
export default async function handler(req, res) {
  try {
    const {
      count = 10,
      industry = 'Professional Services',
      context = {}
    } = req.body;

    // Validate inputs
    if (count > 50) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_COUNT', message: 'Maximum 50 records per request' }
      });
    }

    // Build context for AI
    const validCustomerIds = context.customerIds || [3161, 1834, 1938, 2662];
    const validServiceItems = context.serviceItems || [
      'PS - Post Go-Live Support',
      'PS - Discovery & Design Strategy',
      'PS - Training Services',
      'SVC_PR_Development',
      'SVC_PR_Project Management',
      'SVC_PR_Consulting',
      'SVC_PR_Testing'
    ];
    const validResources = context.resources || ['1', '2', '3', '4', '5', '6', '7', '8'];
    const validClasses = ['1', '2', '3', '4', '5', '6', '7', '8'];

    // Construct prompt for Claude
    const prompt = `You are a NetSuite data architect generating realistic test data for a ${industry} company.

Generate ${count} unique project records with associated tasks. Each project should be realistic and varied.

**STRICT REQUIREMENTS**:
1. Customer IDs MUST be selected ONLY from this list: ${validCustomerIds.join(', ')}
2. Service Items MUST be selected ONLY from this list: ${validServiceItems.join(', ')}
3. Resources MUST be selected ONLY from this list: ${validResources.join(', ')}
4. Billing Classes MUST be selected ONLY from this list: ${validClasses.join(', ')}
5. Each project must have 3-12 tasks
6. Task hours should be realistic (total 50-500 hours per project)
7. Unit costs should vary between $75-$250/hour
8. Project budgets should align with total task costs
9. Use realistic project names for ${industry} industry
10. Vary project statuses (mostly OPEN, some IN_PROGRESS)

**Variance Requirements**:
- Mix small projects (3-5 tasks, 100-200 hours) and large ones (8-12 tasks, 300-500 hours)
- Vary task complexity (some 4-hour tasks, some 80-hour tasks)
- Different service items for different task types
- Realistic resource assignment (some tasks unassigned)

**Industry Context for ${industry}**:
${getIndustryContext(industry)}

Generate high-quality, realistic data that would be useful for testing dashboards and reports.`;

    log.audit('AI Generation Request', { count, industry });

    // Call Claude with structured output
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 16000,
      temperature: 0.7, // Add variance
      messages: [{
        role: 'user',
        content: prompt
      }],
      // Force structured output matching our schema
      tools: [{
        name: 'generate_projects',
        description: 'Generate NetSuite project records with tasks',
        input_schema: PROJECT_SCHEMA
      }],
      tool_choice: { type: 'tool', name: 'generate_projects' }
    });

    // Extract structured data
    const toolUse = message.content.find(block => block.type === 'tool_use');
    if (!toolUse) {
      throw new Error('No structured output from AI');
    }

    const generatedData = toolUse.input;

    // Validate generated data
    const validationErrors = validateGeneratedData(generatedData, {
      validCustomerIds,
      validServiceItems,
      validResources,
      validClasses
    });

    if (validationErrors.length > 0) {
      log.error('Generated Data Validation Failed', validationErrors);
      return res.status(500).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'AI generated data with invalid references',
          details: validationErrors
        }
      });
    }

    log.audit('AI Generation Success', {
      recordCount: generatedData.records.length,
      totalTasks: generatedData.records.reduce((sum, p) => sum + p.tasks.length, 0),
      usage: message.usage
    });

    return res.json({
      success: true,
      data: {
        projects: generatedData.records,
        metadata: {
          model: message.model,
          tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
          generatedAt: new Date().toISOString()
        }
      },
      error: null
    });

  } catch (error) {
    log.error('AI Generation Error', error);

    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'AI_GENERATION_FAILED',
        message: error.message,
        details: { stack: error.stack }
      }
    });
  }
}

/**
 * Get industry-specific context for AI prompt
 */
function getIndustryContext(industry) {
  const contexts = {
    'Professional Services': `
      - Common projects: Implementation, consulting engagements, training programs
      - Typical tasks: Discovery, requirements gathering, design, development, testing, training, go-live support
      - Project duration: 2-6 months
      - Team size: 3-10 people
    `,
    'Environmental Consulting': `
      - Common projects: Stream restoration, habitat assessment, compliance audits
      - Typical tasks: Site survey, sampling, lab analysis, report writing, regulatory filing
      - Project duration: 3-12 months
      - Team size: 2-8 field technicians and engineers
    `,
    'Energy/Midstream': `
      - Common projects: Pipeline construction, facility upgrades, integrity management
      - Typical tasks: Design, permitting, construction, inspection, testing, documentation
      - Project duration: 6-24 months
      - Team size: 10-30 people
    `,
    'PEO Services': `
      - Common projects: HR system implementation, payroll migration, compliance setup
      - Typical tasks: Data migration, system configuration, testing, training, cutover
      - Project duration: 1-4 months
      - Team size: 3-8 people
    `
  };

  return contexts[industry] || contexts['Professional Services'];
}

/**
 * Validate generated data against allowed reference IDs
 */
function validateGeneratedData(data, validLists) {
  const errors = [];

  data.records.forEach((project, idx) => {
    // Check customer ID
    if (!validLists.validCustomerIds.includes(project.customerId)) {
      errors.push(`Project ${idx}: Invalid customerId ${project.customerId}`);
    }

    // Check tasks
    project.tasks.forEach((task, taskIdx) => {
      if (task.serviceItem && !validLists.validServiceItems.includes(task.serviceItem)) {
        errors.push(`Project ${idx}, Task ${taskIdx}: Invalid serviceItem ${task.serviceItem}`);
      }

      if (task.resource && !validLists.validResources.includes(task.resource)) {
        errors.push(`Project ${idx}, Task ${taskIdx}: Invalid resource ${task.resource}`);
      }

      if (task.billingClass && !validLists.validClasses.includes(task.billingClass)) {
        errors.push(`Project ${idx}, Task ${taskIdx}: Invalid billingClass ${task.billingClass}`);
      }
    });
  });

  return errors;
}
