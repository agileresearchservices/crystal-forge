import type { DriveStep } from 'driver.js';

/**
 * Onboarding tour steps for first-time Crystal Forge users
 * Each step highlights a key feature and explains what to do next
 */
export const ONBOARDING_TOUR_STEPS: DriveStep[] = [
  {
    element: '#tour-welcome',
    popover: {
      title: 'Welcome to Crystal Forge! 👋',
      description: `A visual query builder for OpenSearch that helps you construct complex queries without writing JSON DSL manually. Let's take a quick tour of the key features.`,
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-connect-button',
    popover: {
      title: 'Step 1: Connect to OpenSearch',
      description: `Click the Connect button to establish a connection to your OpenSearch cluster. You'll need your cluster URL and credentials.`,
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-connection-status',
    popover: {
      title: 'Connection Status',
      description: `This indicator shows your connection status and the currently selected index. A green dot and index name mean you're connected and ready to query.`,
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-field-list',
    popover: {
      title: 'Step 2: Choose an Index',
      description: `After connecting, select an index from the modal. All available fields from your index will appear here, organized by type and grouped logically.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-field-search',
    popover: {
      title: 'Search Fields',
      description: `Use this search box to quickly find fields in large indices. Type to filter the field list—great when you have hundreds of fields and need to find one quickly.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-query-builder',
    popover: {
      title: 'Step 3: Build Your Query',
      description: `This is the visual query builder. Add fields by clicking the + button on any field, or drag fields here from the sidebar. The builder organizes clauses visually.`,
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-bool-clauses',
    popover: {
      title: 'Bool Query Clauses',
      description: `Organize your conditions into Must (AND), Should (OR), Must Not (NOT), and Filter (fast AND) tabs. Click a tab to make it active before adding fields from the sidebar.`,
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-active-clause',
    popover: {
      title: 'Active Clause Indicator',
      description: `This shows which clause new fields will be added to. Watch it change when you click a different tab. The active clause is highlighted in blue.`,
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-json-panel',
    popover: {
      title: 'Step 4: Review Your Query',
      description: `View the OpenSearch Query DSL JSON in real-time as you build. You can also paste or edit JSON directly—changes instantly update the visual builder and vice versa.`,
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-execute-button',
    popover: {
      title: 'Step 5: Execute Your Query',
      description: `When ready, press Ctrl+Enter (or Cmd+Enter on Mac) or click the green Execute button to run your query against OpenSearch.`,
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-results-panel',
    popover: {
      title: 'Query Results',
      description: `Results appear here in an interactive table. Click any row to expand and explore the full document details. Scroll horizontally to see all fields.`,
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-dark-mode',
    popover: {
      title: 'Dark Mode',
      description: `Toggle between light and dark themes using this button. Your preference is saved automatically for next time.`,
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-panel-resize',
    popover: {
      title: 'Resize Panels',
      description: `Drag the dividers between panels to customize your layout. Make the field list wider, expand the query builder, or give more space to results. Your layout preference is saved.`,
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-help-menu',
    popover: {
      title: 'Help & Documentation',
      description: `Access keyboard shortcuts, field type guides, query pattern examples, and OpenSearch documentation anytime from the Help menu. Replay this tour anytime.`,
      side: 'bottom',
      align: 'end',
    },
  },
  {
    popover: {
      title: `You're All Set! 🎉`,
      description: `You now know the basics of Crystal Forge. Start building queries, explore your data, and refine your searches. Replay this tour anytime from the Help menu → "Take a Tour".`,
    },
  },
];
