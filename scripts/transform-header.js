const fs = require('fs');
const path = require('path');

module.exports = indexHtml => {
  // 1. Extract the hashed CSS filename from the already-processed index.html
  const match = indexHtml.match(/styles\.[a-z0-9]+\.css/);
  const hashedFilename = match ? match[0] : 'styles.css';

  // 2. Define the path to your header file in backend_prod_files
  const headerPath = path.join(
    __dirname,
    '../backend_prod_files/webpack_bundles/header_css.html'
  );

  if (fs.existsSync(headerPath)) {
    const content = fs.readFileSync(headerPath, 'utf8');

    // 3. Inject the hashed filename into the header_css.html template
    const updatedContent = content.replace(
      /\/dist\/oppia-angular-prod\/styles\.css/g,
      `/dist/oppia-angular-prod/${hashedFilename}`
    );

    fs.writeFileSync(headerPath, updatedContent);
  }

  // Return indexHtml unchanged to let the main build finish
  return indexHtml;
};
