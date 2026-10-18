#!/usr/bin/env node
/**
 * Icon family generator for n8n-nodes-terramarbrands.
 *
 * Emits a light + dark SVG pair per node and for the credential into
 * assets/icons/ — the source of truth for the package icons.
 * tools/generate-nodes.mjs copies them into each node directory and
 * credentials/ when present.
 *
 * The family is coherent by construction: every icon shares one canvas
 * (24x24), one stroke style (1.8, round caps/joins, no fills) and the
 * two-color Terramar palette (terracotta = earth, teal = sea). To retheme
 * the whole family, edit PALETTES below and re-run:
 *
 *   node tools/generate-icons.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'assets', 'icons');

const PALETTES = {
	light: { primary: '#B04A2A', accent: '#0F7285' }, // for light UI backgrounds
	dark: { primary: '#EC9374', accent: '#54C8D8' }, // for dark UI backgrounds
};

const g = (primary, body) =>
	`<g fill="none" stroke="${primary}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\n${body}\n</g>`;

/** Each glyph receives the palette colors and returns SVG inner markup. */
const GLYPHS = {
	// Session — "enter": arrow into a door frame, accent doorknob
	TerramarBrandsSession: (p, a) => g(
		p,
		`\t\t<path d="M13.5 3.5h5a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-5" />\n\t\t<path d="M2.5 12h11" />\n\t\t<path d="M10 8.5l3.5 3.5-3.5 3.5" />`,
	) + `\n\t<circle cx="17.6" cy="12" r="0.95" fill="${a}" stroke="none" />`,

	// Catalog — open book, accent text lines
	TerramarBrandsCatalog: (p, a) => g(
		p,
		`\t\t<path d="M12 6.2C10 4.6 7.2 4.2 4 4.2v13.6c3.2 0 6 .4 8 2 2-1.6 4.8-2 8-2V4.2c-3.2 0-6 .4-8 2z" />\n\t\t<path d="M12 6.2v13.6" />`,
	) + `\n\t<g stroke="${a}" stroke-width="1.8" stroke-linecap="round">\n\t\t<path d="M6.3 8.6h3" />\n\t\t<path d="M6.3 11.6h3" />\n\t</g>`,

	// Cart — shopping basket, accent wheels
	TerramarBrandsCart: (p, a) =>
		g(
			p,
			`\t\t<path d="M2.5 3.5h2.2l2.3 11.5h11.6l2.4-8.5H6.2" />`,
		) +
		`\n\t<circle cx="9.6" cy="19.8" r="1.7" fill="${a}" stroke="none" />\n\t<circle cx="16.6" cy="19.8" r="1.7" fill="${a}" stroke="none" />`,

	// Profile — ID badge, accent head
	TerramarBrandsProfile: (p, a) =>
		g(
			p,
			`\t\t<rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />\n\t\t<path d="M7.8 17.2c.7-2.7 2.3-3.9 4.2-3.9s3.5 1.2 4.2 3.9" />`,
		) + `\n\t<circle cx="12" cy="9.2" r="2.6" fill="none" stroke="${a}" stroke-width="1.8" />`,

	// Awards — trophy with accent star
	TerramarBrandsAwards: (p, a) =>
		g(
			p,
			`\t\t<path d="M7.5 2.8h9v6a4.5 4.5 0 0 1-9 0z" />\n\t\t<path d="M7.5 4.8H4.6v1.6a3 3 0 0 0 3 3" />\n\t\t<path d="M16.5 4.8h2.9v1.6a3 3 0 0 1-3 3" />\n\t\t<path d="M12 13.3v3.4" />\n\t\t<path d="M8 20h8" />`,
		) +
		`\n\t<path d="M12 4.6l.95 1.9 2.1.3-1.5 1.5.35 2.1L12 8.9l-1.9 1-.35-2.1-1.5-1.5 2.1-.3z" fill="${a}" stroke="none" />`,

	// Orders — invoice document, accent heading line
	TerramarBrandsOrders: (p, a) =>
		g(
			p,
			`\t\t<path d="M6 2.8h8.2L19 7.6v13.6H6z" />\n\t\t<path d="M14.2 2.8v4.8H19" />\n\t\t<path d="M9 11.6h6" />\n\t\t<path d="M9 14.6h6" />\n\t\t<path d="M9 17.6h3.5" />`,
		) + `\n\t<path d="M9 8.8h3" stroke="${a}" stroke-width="1.8" stroke-linecap="round" />`,

	// Lineage — branching tree, accent member nodes
	TerramarBrandsLineage: (p, a) =>
		g(
			p,
			`\t\t<path d="M12 21v-7.6" />\n\t\t<path d="M12 13.4V7.6" />\n\t\t<path d="M12 13.4c0-2.7-2.6-3.4-6.7-3.4" />\n\t\t<path d="M12 13.4c0-2.7 2.6-3.4 6.7-3.4" />`,
		) +
		`\n\t<circle cx="12" cy="5.9" r="1.7" fill="${a}" stroke="none" />\n\t<circle cx="3.6" cy="10" r="1.7" fill="${a}" stroke="none" />\n\t<circle cx="20.4" cy="10" r="1.7" fill="${a}" stroke="none" />`,

	// Support — headset, accent microphone boom
	TerramarBrandsSupport: (p, a) =>
		g(
			p,
			`\t\t<path d="M4.5 13.5a7.5 7.5 0 0 1 15 0" />\n\t\t<rect x="3" y="13.5" width="4" height="5.5" rx="1.6" />\n\t\t<rect x="17" y="13.5" width="4" height="5.5" rx="1.6" />`,
		) + `\n\t<path d="M17 19v.8a2.2 2.2 0 0 1-2.2 2.2H12" stroke="${a}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,

	// Travel — paper plane, accent fold
	TerramarBrandsTravel: (p, a) =>
		g(
			p,
			`\t\t<path d="M21.4 2.6L2.6 10.9l7.5 3 3 7.5z" />`,
		) + `\n\t<path d="M21.4 2.6L10.1 13.9" stroke="${a}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />`,

	// Certificates — document with accent ribbon
	TerramarBrandsCertificates: (p, a) =>
		g(
			p,
			`\t\t<rect x="4.5" y="2.8" width="15" height="12.4" rx="2" />\n\t\t<path d="M8 6.4h8" />\n\t\t<path d="M8 9.4h5.5" />`,
		) + `\n\t<path d="M9 15.2l-1.4 6 4.4-2.8 4.4 2.8-1.4-6" fill="none" stroke="${a}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />`,

	// Payments — card, accent stripe
	TerramarBrandsPayments: (p, a) =>
		g(
			p,
			`\t\t<rect x="2.8" y="5.2" width="18.4" height="13.6" rx="2.4" />\n\t\t<path d="M6.2 13.6h2.4" />\n\t\t<path d="M10.6 13.6h2.4" />`,
		) + `\n\t<path d="M2.8 9.6h18.4" stroke="${a}" stroke-width="1.8" stroke-linecap="round" />`,

	// Product — box, accent seam
	TerramarBrandsProduct: (p, a) =>
		g(
			p,
			`\t\t<path d="M4 7.6l8-4.2 8 4.2v8.8l-8 4.2-8-4.2z" />\n\t\t<path d="M4 7.6l8 4.2 8-4.2" />`,
		) + `\n\t<path d="M12 11.8v8.8" stroke="${a}" stroke-width="1.8" stroke-linecap="round" />`,

	// Credential (terramarbrands) — key: bow, shaft, accent teeth
	terramarbrands: (p, a) =>
		g(
			p,
			`\t\t<circle cx="7.6" cy="7.6" r="4.6" />\n\t\t<path d="M10.9 10.9l9.5 9.5" />`,
		) +
		`\n\t<g stroke="${a}" stroke-width="1.8" stroke-linecap="round">\n\t\t<path d="M15.6 15.6l2.4-2.4" />\n\t\t<path d="M18.6 18.6l2-2" />\n\t</g>`,
};

const svgWrap = (inner) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">\n${inner}\n</svg>\n`;

mkdirSync(OUT, { recursive: true });
let written = 0;
for (const [name, glyph] of Object.entries(GLYPHS)) {
	writeFileSync(
		path.join(OUT, `${name}.svg`),
		svgWrap(glyph(PALETTES.light.primary, PALETTES.light.accent)),
	);
	written++;
	writeFileSync(
		path.join(OUT, `${name}.dark.svg`),
		svgWrap(glyph(PALETTES.dark.primary, PALETTES.dark.accent)),
	);
	written++;
}
console.log(
	`Wrote ${written} SVGs (${Object.keys(GLYPHS).length} glyphs x light/dark) to ${path.relative(ROOT, OUT)}`,
);
console.log(`Palettes — light: ${JSON.stringify(PALETTES.light)} | dark: ${JSON.stringify(PALETTES.dark)}`);
