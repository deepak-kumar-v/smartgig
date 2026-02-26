/**
 * SYSTEM INTELLIGENCE — Unified Integrity Enforcement
 *
 * Validates:
 * 1. Route coverage (missing metadata, orphan entries)
 * 2. Inheritance integrity (parent existence, self/circular/cross-domain)
 * 3. Version drift
 *
 * Run: tsx scripts/validate-intelligence.ts
 * Integrated into build: npm run validate:intelligence && next build
 */

import * as fs from 'fs';
import * as path from 'path';
import {
    getRegisteredRoutes,
    resolvePageIntelligence,
    getIntelligenceDriftReport,
    getRegistrySnapshot,
} from '../src/system/intelligence-registry';
import type { PageIntelligenceMeta } from '../src/system/intelligence-registry';

// ============================================================================
// Route Scanner
// ============================================================================

const APP_DIR = path.resolve(__dirname, '..', 'src', 'app');

/**
 * Recursively collect all page.tsx routes under the app directory.
 * Ignores layout.tsx, loading.tsx, error.tsx, not-found.tsx.
 * Strips route groups (parenthesized folders like (dashboard)).
 */
function collectRoutes(dir: string, basePath: string = ''): string[] {
    const routes: string[] = [];

    if (!fs.existsSync(dir)) return routes;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const segment = entry.name;
            const isRouteGroup = segment.startsWith('(') && segment.endsWith(')');
            const nextBase = isRouteGroup ? basePath : `${basePath}/${segment}`;
            routes.push(...collectRoutes(path.join(dir, segment), nextBase));
        } else if (entry.isFile() && entry.name === 'page.tsx') {
            const route = basePath || '/';
            routes.push(route);
        }
    }

    return routes;
}

// ============================================================================
// Validation
// ============================================================================

function run(): void {
    const detectedRoutes = collectRoutes(APP_DIR);
    const registeredRoutes = getRegisteredRoutes();
    const registrySnapshot = getRegistrySnapshot();

    // A) Missing Metadata
    const missingMetadata: string[] = [];
    for (const route of detectedRoutes) {
        const meta = resolvePageIntelligence(route);
        if (!meta) {
            missingMetadata.push(route);
        }
    }

    // B) Orphan Metadata
    const orphanMetadata: string[] = [];
    for (const registered of registeredRoutes) {
        const matchesAnyRoute = detectedRoutes.some(
            (route) => route === registered
        );
        if (!matchesAnyRoute) {
            orphanMetadata.push(registered);
        }
    }

    // C) Inheritance Integrity
    const inheritanceViolations: string[] = [];
    for (const route of registeredRoutes) {
        const meta = registrySnapshot[route];
        if (!meta || !meta.inheritsFrom) continue;

        if (meta.route === meta.inheritsFrom) {
            inheritanceViolations.push(
                `Self-inheritance: ${meta.route} inheritsFrom itself`
            );
            continue;
        }

        const parent = registrySnapshot[meta.inheritsFrom];
        if (!parent) {
            inheritanceViolations.push(
                `Missing parent: ${meta.route} inheritsFrom "${meta.inheritsFrom}" which does not exist`
            );
            continue;
        }

        if (meta.domain !== parent.domain) {
            inheritanceViolations.push(
                `Cross-domain inheritance: ${meta.route} (${meta.domain}) inheritsFrom ${parent.route} (${parent.domain})`
            );
        }

        const visited = new Set<string>([meta.route]);
        let current: string | undefined = meta.inheritsFrom;

        while (current) {
            if (visited.has(current)) {
                inheritanceViolations.push(
                    `Circular inheritance: ${meta.route} → chain revisits "${current}"`
                );
                break;
            }

            visited.add(current);
            const ancestor: PageIntelligenceMeta | undefined = registrySnapshot[current];
            current = ancestor?.inheritsFrom;
        }
    }

    // D) Version Drift
    const driftReport = getIntelligenceDriftReport();

    // E) Metadata Depth Metrics (Non-blocking insight)
    const depthMetrics = {
        totalRoutes: registeredRoutes.length,
        withCurrentPage: 0,
        withSystemDiagrams: 0,
        withAttackDefense: 0,
        withSafeguards: 0,
        withScaleHardening: 0,
    };

    for (const route of registeredRoutes) {
        const meta = registrySnapshot[route];

        if (meta.currentPage) depthMetrics.withCurrentPage++;
        if (meta.systemDiagrams) depthMetrics.withSystemDiagrams++;
        if (meta.attackDefense) depthMetrics.withAttackDefense++;
        if (meta.currentPage?.safeguards?.length) depthMetrics.withSafeguards++;
        if (meta.scaleHardening) depthMetrics.withScaleHardening++;
    }

    // ========================================================================
    // Unified Violation Report
    // ========================================================================

    const allViolationsExist =
        missingMetadata.length > 0 ||
        orphanMetadata.length > 0 ||
        inheritanceViolations.length > 0 ||
        driftReport.drifted.length > 0;

    if (allViolationsExist) {
        console.error('');
        console.error('====================================');
        console.error('SYSTEM INTELLIGENCE INTEGRITY FAILURE');
        console.error('====================================');
        console.error('');

        if (missingMetadata.length > 0) {
            console.error(`Missing Metadata (${missingMetadata.length} route(s))`);
            for (const route of missingMetadata) {
                console.error(`  - ${route}`);
            }
            console.error('');
        }

        if (orphanMetadata.length > 0) {
            console.error(`Orphan Metadata (${orphanMetadata.length} entry/entries)`);
            for (const route of orphanMetadata) {
                console.error(`  - ${route}`);
            }
            console.error('');
        }

        if (inheritanceViolations.length > 0) {
            console.error(`Inheritance Violations (${inheritanceViolations.length})`);
            for (const v of inheritanceViolations) {
                console.error(`  ✗ ${v}`);
            }
            console.error('');
        }

        if (driftReport.drifted.length > 0) {
            console.error(`Version Drift (${driftReport.drifted.length} route(s))`);
            for (const d of driftReport.drifted) {
                console.error(
                    `  - ${d.route} (v${d.pageVersion} → v${d.systemVersion}) ${d.drift}`
                );
            }
            console.error('');
        }

        console.error('Fix issues in src/system/intelligence-registry.ts');
        console.error('See /docs/system-intelligence-directive.md');
        console.error('');

        process.exit(1);
    }

    console.log('');
    console.log('[System Intelligence] ✓ Registry validation passed.');
    console.log(`  Routes: ${detectedRoutes.length} detected, ${registeredRoutes.length} registered, ${driftReport.inSync} in sync.`);
    console.log('');
    console.log('  Architecture Depth Summary:');
    console.log(`    CURRENT_PAGE coverage:  ${depthMetrics.withCurrentPage}/${depthMetrics.totalRoutes}`);
    console.log(`    systemDiagrams coverage: ${depthMetrics.withSystemDiagrams}/${depthMetrics.totalRoutes}`);
    console.log(`    attackDefense coverage:  ${depthMetrics.withAttackDefense}/${depthMetrics.totalRoutes}`);
    console.log(`    safeguards coverage:     ${depthMetrics.withSafeguards}/${depthMetrics.totalRoutes}`);
    console.log(`    scaleHardening coverage: ${depthMetrics.withScaleHardening}/${depthMetrics.totalRoutes}`);
    console.log('');

    if (process.env.NODE_ENV !== 'production') {
        const routesMissingDiagrams = registeredRoutes.filter(
            r => !registrySnapshot[r].systemDiagrams
        );

        if (routesMissingDiagrams.length > 0) {
            console.warn(
                `[System Intelligence] Advisory: ${routesMissingDiagrams.length} routes lack systemDiagrams.`
            );
        }
    }

    process.exit(0);
}

run();
