# CSS

## Overview

This folder contains all the global style sheets for the oppia frontend.

## Files:

1. oppia.css — Custom css styles written by the oppia-devs for the frontend.
2. oppia-material.css — Material CSS for the oppia-codebase. This css file is generated and shouldn't be modified at all.

## Modification procedure:

1. oppia.css can be modified with proper reasoning in the pr that modifies the file.
2. oppia-material.css shouldn't be changed at any cost. No changes are accepted in this file.
   If, at any time, the oppia-material.css is overriding the styles in oppia.css, create a style tag in the directive and make the selectors more specific.

## Oppia Material

**If at any time the css file is regenerated please update the pr number here**

- Introduced in: #9577
- Updated in: N/A (Comma separated pr numbers).

### Info

More info regarding the oppia-material.css can be found in this doc:
Material CSS doc: https://docs.google.com/document/d/1UoCOC7XNhCZrWIMPAoR5Xex28OYWzteqXrqCU9gRUHQ/edit?usp=sharing

### Steps to generate oppia-material.css file:

Video: https://drive.google.com/file/d/1bRA0824CV6cDNYANcX2KT4skNilKdynh/view?usp=sharing

1. Clone angular components: `git clone https://github.com/angular/components.git`
2. `cd components`
3. `cd src/material/core/theming/prebuilt/`
4. `code .` (if you use vscode or open this folder in the code editor of your choice).
5. open any of the four files present in the folder.
6. Generate and copy a palette from http://mcg.mbitson.com/#!?oppia=%23009688 and paste it in the scss file.
7. Change `md` - `mat` and change $primary variable value to be mat-palette($mat-oppia) in scss file.
8. Change $accent variable value to be mat-palette($mat-blue)
9. Install node-sass (`npm i -g node-sass`)
10. Run `node-sass ./deeppurple-amber.scss oppia-material.css`
