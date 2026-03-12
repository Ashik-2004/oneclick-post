# Teal Design System Starter

This starter turns your design brief into reusable styles for a React app.

## What is included

- `theme.css`: color tokens, typography, spacing, borders, surfaces, and form/button primitives
- `react/AnimatedPresence.jsx`: small helpers built on `react-transition-group@4.4.2`
- `react/transitions.css`: matching enter and exit motion classes

## Brand rules captured here

- Color palette: `#042f2e`, `#065f46`, `#10b981`, `#34d399`, `#ecfeff`
- Font: `Montserrat` with weights `400`, `600`, `800`
- Letter spacing: `-1px`
- Borders: `rgba(255,255,255,0.08)`
- Motion: `react-transition-group@4.4.2`

## Install in a React app

1. Add the dependency:

```bash
npm install react-transition-group@4.4.2
```

2. Load the font in your app shell:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap" rel="stylesheet" />
```

3. Import the styles near your app entry:

```js
import "../design-system/theme.css";
import "../design-system/react/transitions.css";
```

4. Use the primitives:

```jsx
<main className="ds-shell ds-stack">
  <section className="ds-card ds-stack" style={{ padding: "2rem" }}>
    <p className="ds-heading-xl">One-touch publishing</p>
    <p className="ds-copy">
      Draft once, refine quickly, and publish to X and LinkedIn from one place.
    </p>
    <div className="ds-inline">
      <button className="ds-button">Generate post</button>
      <button className="ds-button ds-button--ghost">Preview</button>
    </div>
  </section>
</main>
```

## Notes

- The background uses layered teal gradients instead of a flat fill.
- Hairline borders are standardized through `--color-border-hairline`.
- Motion is intentionally soft and directional to support cards, alerts, and previews.
