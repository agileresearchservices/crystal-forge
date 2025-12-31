# OpenSearch/Elasticsearch Query Builder Landscape Analysis

## Executive Summary

There **are** some existing tools, but they have significant gaps:
- **Mirage** is the closest competitor - a blocks-based GUI query builder for Elasticsearch
- **Diggie** is a desktop app for OpenSearch with query builder features
- **Dejavu** is a general-purpose ES/OpenSearch UI for browsing/editing data (not specifically a query builder)
- Most backend builders (Go, PHP, Node, Java) are SDK libraries, not web UIs
- **No actively maintained, modern, full-featured web-based visual DSL query builder for OpenSearch specifically exists**

This means your idea is genuinely valuable and worth building.

---

## Existing Tools Overview

### 1. **Mirage** (appbaseio/mirage) ⭐ CLOSEST MATCH
**GitHub:** https://github.com/appbaseio/mirage  
**Status:** Open source (Apache 2.0) but somewhat dated  
**Last Major Update:** 2019 (v0.11.0)  

**What it does well:**
- Block-based GUI for composing Elasticsearch queries
- Real-time JSON DSL preview as you build
- Schema-aware - uses index mappings to show only applicable queries per field type
- Inline documentation links for each query type
- Works with ES 2.x, 5.x, 6.x, 7.x
- Available as: hosted web app, Chrome extension, Docker, ES plugin (deprecated)

**Limitations:**
- Built with Angular 2 (ancient by 2025 standards)
- Last update was in 2019 - no OpenSearch-specific support
- No modern UX/DX improvements (no TypeScript, no modern tooling)
- Limited query type support (not all DSL features)
- No aggregation builder
- No test/execution capabilities built-in
- No code export (Python, JS, cURL snippets)
- No template/preset system

**Verdict:** This proves the concept works, but it's outdated and ES-focused, not OpenSearch-optimized.

---

### 2. **Diggie** (DiggieApp/Diggie)
**GitHub:** https://github.com/DiggieApp/Diggie  
**Status:** Desktop app, developer preview  
**Last Update:** November 2021  

**What it does:**
- Desktop application (macOS/Windows) for AWS OpenSearch
- Query builder with visual interface
- Query results viewer
- Query history tracking
- AWS Signature V4 header generation

**Limitations:**
- Desktop only (not web-based)
- Seems lightweight, feature-set not fully clear from repo
- Appears to be abandoned (last commit 2021, only 11 stars)
- No open development/roadmap

**Verdict:** Too early/abandoned to be a reference, but shows there's market need for OpenSearch-specific tools.

---

### 3. **Dejavu** (appbaseio/dejavu)
**GitHub:** https://github.com/appbaseio/dejavu  
**Status:** Open source (MIT), actively maintained  
**Current Focus:** Data browsing, import/export, basic filtering  

**What it does:**
- Modern React-based UI for Elasticsearch/OpenSearch
- Index browsing, document CRUD
- CSV/JSON import with field mapping
- Visual filters and query views
- Search UI builder (generate React code)
- Works with ES 7.x+, OpenSearch 2.0+

**Limitations:**
- NOT a DSL query builder - it's for browsing/managing data
- Limited query composition capabilities
- Focuses on search UX builder, not query DSL builder
- No code export for DSL queries

**Verdict:** Complementary tool, not a replacement. Good for data exploration but not for building complex DSL queries.

---

### 4. **Backend Query Builders** (Not Web UIs)

These are SDK libraries for building queries programmatically:

| Language | Project | Type | Status |
|----------|---------|------|--------|
| Go | osquery (defensestation/opeious) | Method-chaining API | Active-ish |
| PHP | ongr-io/ElasticsearchDSL | Object-oriented builder | Maintained |
| PHP | spatie/elasticsearch-query-builder | Fluent API | Maintained |
| Node.js | elastic-builder | Query body builder | Older |
| Node.js | es-builder | Query builder | Older |
| Java | Various in OpenSearch/Elasticsearch | Native builders | Part of SDK |
| Laravel | ElasticBuilder | Framework package | Older |

**Why these don't compete:**
- These are for developers writing code, not UI-based tools
- No visual/interactive component
- No real-time testing/execution built-in
- Not intended for non-developers

---

### 5. **Search-Focused Tools** (Not Query Builders)

These build search experiences, not query builders:
- **Searchkit** - UI components for building search interfaces (React/Vue)
- **Elastic Search UI** - Component library for search experiences
- **ReactiveSearch** - No-code UI builder for search
- **appbase.io UI Builder** - Commercial no-code search UI builder

**Why they don't compete:**
- These are for end-user search experiences, not for building complex queries
- Limit customization to satisfy business requirements
- Not intended for technical users needing full DSL control

---

### 6. **IDE/Console Tools**

- **Kibana Dev Tools Console** - Built-in to Kibana, REST console (not visual)
- **Postman** - General-purpose REST client (manual JSON editing)
- **VS Code Elastic Extension** - VS Code plugin for query building

**Limitations:**
- Manual JSON editing (not visual)
- No schema-awareness
- No intelligent suggestions based on field types

---

## Competitive Analysis Summary

| Feature | Mirage | Diggie | Dejavu | Your Idea |
|---------|--------|--------|--------|-----------|
| **Visual Query Builder** | ✅ | ✅ | ⚠️ Basic | ✅ Full |
| **OpenSearch Focused** | ❌ (ES only) | ✅ | ✅ | ✅ |
| **Web-Based** | ✅ | ❌ Desktop | ✅ | ✅ |
| **Modern Stack** | ❌ Angular 2 | Unknown | ✅ React | ✅ Next.js/TS |
| **Query Execution** | ✅ | ✅ | ✅ | ✅ |
| **Code Export** | ❌ | ❌ | Limited | ✅ (Plan) |
| **Schema-Aware** | ✅ | ? | ✅ | ✅ |
| **Full DSL Support** | ⚠️ Partial | ? | ⚠️ Partial | ✅ Complete |
| **Aggregations Builder** | ❌ | ? | ❌ | ✅ (Plan) |
| **Test Templates** | ❌ | ? | ❌ | ✅ (Plan) |
| **Actively Maintained** | ❌ 2019 | ❌ 2021 | ✅ | ✅ New |
| **Query History** | ❌ | ✅ | ❌ | ✅ (Plan) |

---

## Gaps That Justify Your Project

1. **No Modern, Actively-Maintained Solution**
   - Mirage is the gold standard but abandoned (2019)
   - Built with outdated Angular 2
   - Would need complete rewrite to modernize

2. **No OpenSearch-First Tool**
   - Most are Elasticsearch-focused
   - OpenSearch has diverged significantly
   - Needs OpenSearch-specific DSL knowledge (KNN, hybrid search, security)

3. **Limited Feature Set**
   - None have comprehensive DSL coverage
   - No aggregation builder
   - No advanced features like explain mode, profiling
   - No code export/snippets
   - No template system

4. **UX/DX Issues in Existing Tools**
   - Mirage has dated UI/code
   - No modern dev tooling
   - No TypeScript support
   - Limited customization

5. **Missing "Developer Workflow" Features**
   - No proper query history/versioning
   - No save/share capabilities
   - No collaboration features
   - No integration with CI/CD

---

## Recommendation

### **BUILD IT** ✅

**Reasons:**
1. **Mirage proves the concept works** - blocks-based GUI is the right approach
2. **Market gap is real** - nothing modern, OpenSearch-focused exists
3. **Your unique position** - deep OpenSearch knowledge from your Gartner work
4. **Modern tech advantage** - Next.js + TypeScript beats Angular 2 from 2019
5. **Opportunity for differentiation** - code export, aggregations, advanced features Mirage lacks

### **What to Learn From Mirage**

- ✅ Block-based GUI is superior to text-based builders
- ✅ Schema awareness (field type → applicable queries) is crucial UX
- ✅ Real-time JSON preview keeps users informed
- ✅ Inline documentation is helpful
- ❌ Avoid: Angular 2 (use React/Next.js)
- ❌ Avoid: Incomplete feature coverage
- ❌ Avoid: No execution/testing capabilities

### **Your Competitive Advantages**

1. **Modern Stack** - Next.js 15, TypeScript, React 18, Tailwind
2. **OpenSearch Focus** - Not Elasticsearch port
3. **Complete Feature Set** - Aggregations, advanced options, all DSL types
4. **Developer Experience** - Code export, templates, integrations
5. **Well-Maintained** - Active development, your expertise
6. **Better UX** - Modern design, better feedback, helpful hints

---

## Potential Monetization/Distribution

- **Open Source** (MIT/Apache 2.0) like Mirage
- **SaaS Hosted** - $10-50/month for shared instance
- **Enterprise** - Self-hosted, authentication, multi-user (higher tier)
- **Integration** - Sell as OpenSearch Dashboards plugin
- **Companies to approach** - AWS, Elastic, Databricks, vector DB companies using search

---

## Conclusion

**There are existing tools, but none are truly competitive.** Building this as a modern, OpenSearch-focused, feature-rich application fills a genuine market gap. Mirage's 1000+ stars shows there's real demand. A modern replacement would definitely find users.

**Timeline to MVP:** 2-3 months for core features (visual builder, JSON editor, query execution)
