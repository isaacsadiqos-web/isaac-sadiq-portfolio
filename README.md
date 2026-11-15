[README.md](https://github.com/user-attachments/files/34888016/README.md)
# Isaac Sadiq: Cybersecurity Academic Portfolio

A responsive, five-page portfolio website for **Isaac Sadiq**, B.Sc. Cybersecurity student at **MIVA Open University**. Built with plain HTML5, CSS3 and vanilla JavaScript. No frameworks, no build step.

## Overview

The site presents Isaac's academic profile, skills, career aspirations (Cybersecurity Analyst, Digital Business Consultant), demonstration projects, a working academic planner and a validated contact form, in a dark, cybersecurity-inspired design.

> **Honesty note.** The projects and planner tasks are clearly labelled *demonstration* / *sample* content. The site makes no claims about certifications, awards, employment, grades or graduation dates. Skill bars are labelled as self-assessed.

## Pages and features

| Page | File | Highlights |
| --- | --- | --- |
| Home | `index.html` | Hero with photo, biography, interests, skills overview, featured projects, academic background, career aspirations, motto, contact CTA |
| About | `about.html` | Biography, education, learning-focus **table**, career paths, categorised skills, interests with an **audio** player, motto |
| Projects | `projects.html` | Three demonstration projects, category filter, detail dialogs, comparison **table**, process list |
| Academic Planner | `planner.html` | Add / edit / delete / complete tasks, filters, search, sorting, statistics, progress bar, localStorage |
| Contact | `contact.html` | Direct contact details, validated form, prepared `mailto:` links |

Site-wide: shared navigation with active state, mobile menu, scroll-progress bar, back-to-top button, scroll-triggered reveals, skip link, focus styles, reduced-motion support, SEO metadata and a custom SVG favicon.

## Technologies

- **HTML5**: semantic elements (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`), forms, tables, ordered/unordered lists, images, `audio`, `dialog`
- **CSS3**: custom properties, Flexbox, Grid, media queries (mobile to 2200px+), transitions, keyframe animations
- **JavaScript (ES6)**: DOM manipulation, event delegation, arrays and objects, `localStorage`, form validation
- **Fonts**: Space Grotesk (headings) and Inter (body) from Google Fonts, with system fallbacks

## Folder structure

```
/
├── index.html
├── about.html
├── projects.html
├── planner.html
├── contact.html
├── css/
│   └── style.css            shared stylesheet and design tokens
├── js/
│   ├── main.js              navigation, scroll effects, toasts, projects page
│   ├── planner.js           academic planner logic
│   └── contact.js           contact form validation
├── assets/
│   ├── images/              isaac-sadiq.jpg + project preview SVGs
│   ├── icons/               favicon.svg
│   └── media/               demo-secure-chime.mp3 (generated demo tone)
└── README.md
```

## Run locally

Open `index.html` directly in a browser, or serve the folder for a more realistic test:

```bash
# from the project folder
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy to GitHub Pages

All asset and page links are **relative**, so the site works from a repository sub-path (`https://<user>.github.io/<repo>/`).

1. Create a new GitHub repository and upload the contents of this folder to the repository root (so `index.html` is at the top level).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then **Save**.
4. After a minute your site is live at `https://<your-username>.github.io/<repository-name>/`.

## Academic planner

- **Create / edit / delete** tasks with title, description, due date, category, priority and status
- **Complete / reopen** a task with its checkbox
- **Filters**: All, Pending, Completed, High priority
- **Search** across title, description, category and priority
- **Sort** by due date (soonest or latest), priority, or recently added
- **Statistics**: total, completed, pending, completion percentage, plus a progress bar
- **Delete confirmation**, empty states, toast notifications, overdue / due-today badges
- **Persistence** via `localStorage`; data survives refreshes but stays in that browser only
- **Sample tasks** appear on the first visit, labelled *Sample*, with due dates relative to the current day. Remove them with **Remove sample tasks**; they are not re-added automatically, and the empty state offers **Load sample tasks**.

To reset the planner completely, clear this site's data in your browser settings.

## Contact form limitations

There is **no backend**. The form validates input in the browser (required fields, email format, digits-only phone of 7 to 15 digits, minimum message length), then shows a success message stating the message **was not delivered**. It also prepares `mailto:` links so a visitor can send the message from their own email app. To receive messages directly, connect a form service such as Formspree or Netlify Forms.

## Things to update later

- **Project links**: the Demo and GitHub buttons are labelled placeholders. For GitHub, put a repository URL in a button's `data-repo` attribute in `projects.html`.
- **Social profiles** on `contact.html` are placeholders.
- **Project previews** are illustrative SVG graphics; replace them with real screenshots when real projects exist.
- **Demo audio** is a generated tone, not a recording by Isaac. Replace `assets/media/demo-secure-chime.mp3` with his own music or audio if desired.

## Credits

Designed and built as an academic assessment project for MIVA Open University.
&copy; Isaac Sadiq.
