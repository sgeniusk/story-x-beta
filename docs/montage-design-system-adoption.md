# Story X Montage Design System Adoption

Story X adopts the Montage Web design language as a local token layer instead of installing the WDS package directly.

Reason:

- `@wanteddev/wds` is distributed through GitHub Packages, which can require registry authentication.
- Story X already has custom React surfaces and a fast Vite prototype workflow.
- Keeping the token layer local lets Codex and Claude Code evolve the UI without blocking on package access.

## Token Mapping

The source of truth is `src/styles.css`.

- Primitive tokens use the `--wds-color-*` and `--wds-spacing-*` names from Montage Web.
- Semantic tokens use `--wds-semantic-color-*` names for label, background, line, status, fill, and elevation.
- Component tokens use `--wds-component-*` aliases for button radius, card radius, panel radius, and common control sizing.
- Story X aliases such as `--ink`, `--paper`, `--card`, `--line`, `--button-bg`, and `--control-radius` point back to those WDS-style tokens.

## Application Rule

New UI should consume Story X aliases first, and add a WDS-style token only when it is a reusable primitive, semantic, or component decision.

Do not hard-code a new neutral surface, border, or button color unless it is a one-off illustration or content artifact.
