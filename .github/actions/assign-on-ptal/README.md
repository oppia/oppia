## Auto-assign thread based on PTAL

This actions automates the following functionality:
- When someone says `@someone PTAL`, assign the member to the thread automatically.
- Additionally, it can also assign multiple members at one using this syntax: `@abc @xyz @pqr ptal`

#### Development
- Install dependencies
  `npm install ./.github/actions/assign-on-ptal`
- Compile TypeScript
  `npm run build`