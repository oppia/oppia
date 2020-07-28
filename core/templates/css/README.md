Steps to generate oppia-material.css file:

Video: https://drive.google.com/file/d/1bRA0824CV6cDNYANcX2KT4skNilKdynh/view?usp=sharing

1. Clone angular components: `git clone https://github.com/angular/components.git`
2. `cd components`
3. `cd src/material/core/theming/prebuilt/`
4. `code .` (if you use vscode or open this folder in the code editor of your choice).
5. open any of the four files present in the folder.
6. Generate and copy a palette from http://mcg.mbitson.com/#!?oppia=%23009688 and paste it in the scss file.
7. Change `md` - `mat` and change $primary varibale value to be mat-palette($mat-oppia) in scss file.
8. Change $accent varibale value to be mat-pallete($mat-blue)
9. Install node-sass (`npm i -g node-sass`)
10. Run `node-sass ./deeppurple-amber.scss oppia-material.css`

Material CSS doc:
PR Doc: https://docs.google.com/document/d/1UoCOC7XNhCZrWIMPAoR5Xex28OYWzteqXrqCU9gRUHQ/edit?usp=sharing

Introduced in: #9577
Updated in: N/A