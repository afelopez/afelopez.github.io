# Add Project to Portfolio

You are adding a new production project to this portfolio site. The project list lives in `src/data/projects.ts`.

## Data structure

```typescript
// src/data/projects.ts
export type LinkType = 'frontend' | 'swagger' | 'api' | 'github';

export interface ProjectLink {
  label: string;   // "Live App" | "API Docs" | "Swagger" | "GitHub"
  url: string;
  type: LinkType;
}

export interface Project {
  id: string;          // kebab-case slug  →  "my-project"
  name: string;        // display name     →  "My Project"
  description: string; // 1–2 sentences describing the product and its users
  tech: string[];      // ["Ruby on Rails", "PostgreSQL", "Railway"]
  links: ProjectLink[];
  logo?: string;       // "/projects/my-project-logo.png"  (file goes in /public/projects/)
  brandColor?: string; // hex, dominant dark brand color  →  "#0e1830"
}
```

## Your job

Ask the user for each field **one question at a time**. Wait for the answer before asking the next. Do not batch questions.

### Question sequence

1. **Name** — "What is the display name of the project?"
2. **ID** — Suggest a kebab-case slug derived from the name. Ask: "Should I use `<suggested-slug>` as the ID, or do you want a different one?"
3. **Description** — "Describe the project in 1–2 sentences: what does it do and who uses it?"
4. **Tech stack** — "List the main technologies, comma-separated (e.g. Ruby on Rails, PostgreSQL, Vercel)."
5. **Links** — "Does it have a live frontend, Swagger docs, an API endpoint, or a GitHub link?" Collect them one by one:
   - Ask for the URL
   - Ask for the label (suggest one based on the type)
   - Ask for the type: `frontend` / `swagger` / `api` / `github`
   - After each link ask: "Any other links? (yes / no)"
6. **Logo** — "Do you have a logo image for this project? If yes, what is the filename? (e.g. my-project-logo.png)"
   - If yes, remind the user: "Place the file at `public/projects/<filename>` before deploying."
7. **Brand color** — "What is the dominant dark background color of the brand? (hex, e.g. #0e1830). If unsure, I will use #111827."

### Before writing

Show the user the full project object you are about to add:

```
Here is what I will add to src/data/projects.ts:

{
  id: '...',
  name: '...',
  description: '...',
  tech: [...],
  links: [...],
  logo: '...',         // if provided
  brandColor: '...',
}

Looks good? (yes / adjust)
```

### Writing the entry

Once confirmed, append the new object inside the `projects` array in `src/data/projects.ts`. Keep existing entries untouched.

Do **not** rewrite or reformat the file — only add the new object at the end of the array, before the closing `]`.

### After writing

Tell the user:
- The entry was added to `src/data/projects.ts`
- If a logo was provided: "Remember to place `<filename>` in `public/projects/`"
- "Run `npm run dev` to preview, then commit and push to deploy."
