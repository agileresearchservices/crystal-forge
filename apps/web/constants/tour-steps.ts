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
      description: `A visual query builder for OpenSearch that helps you construct complex queries without writing JSON DSL manually.`,
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-connect-button',
    popover: {
      title: 'Step 1: Connect to OpenSearch',
      description: `Click the Connect button to set up your OpenSearch connection. You'll need your cluster URL and credentials.`,
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-connection-status',
    popover: {
      title: 'Connection Status',
      description: `This indicator shows your connection status and the currently selected index. A green dot means you're connected.`,
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '#tour-field-list',
    popover: {
      title: 'Step 2: Choose an Index',
      description: `After connecting, select an index to explore. All available fields from your index will appear in this list, organized by type.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-field-search',
    popover: {
      title: 'Search Fields',
      description: `Use this search box to quickly find fields in large indices. Great when you have hundreds of fields and need to narrow down to one.`,
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-query-builder',
    popover: {
      title: 'Step 3: Build Your Query',
      description: `This is the query builder. Add fields by clicking the + button next to any field, or drag fields here from the sidebar.`,
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-bool-clauses',
    popover: {
      title: 'Bool Query Clauses',
      description: `Organize your query using Must (AND), Should (OR), Must Not (NOT), and Filter (fast AND) tabs. Click a tab to make it active before adding fields.`,
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-active-clause',
    popover: {
      title: 'Active Clause Indicator',
      description: `This shows which clause new fields will be added to. Watch it change when you click a different tab above.`,
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#tour-json-panel',
    popover: {
      title: 'Step 4: Review Your Query',
      description: `See the OpenSearch Query DSL JSON in real-time. You can also paste JSON here to have it automatically convert to the visual builder format.`,
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-explore-panel',
    popover: {
      title: 'Explore & Filter',
      description: `Click the "Explore" tab to see field value distributions. Click any value to add it as a filter to your query.`,
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#tour-execute-button',
    popover: {
      title: 'Step 5: Execute Your Query',
      description: `When ready, press Ctrl+Enter or click the execute button to run your query against OpenSearch. Validation will automatically check for errors.`,
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-results-panel',
    popover: {
      title: 'Query Results',
      description: `Results appear here with expandable rows. Click any row to explore the document details in full.`,
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '#tour-help-menu',
    popover: {
      title: 'Need Help?',
      description: `Access keyboard shortcuts, field type guides, query pattern examples, and OpenSearch documentation anytime from the Help menu.`,
      side: 'bottom',
      align: 'end',
    },
  },
  {
    popover: {
      title: `You're All Set! 🎉`,
      description: `You now know the basics of Crystal Forge. Start building queries and exploring your data! You can replay this tour anytime from the Help menu.`,
      side: 'center',
      align: 'center',
    },
  },
];
