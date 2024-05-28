const {configureToMatchImageSnapshot} = require('jest-image-snapshot');

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  customSnapshotIdentifier: ({defaultIdentifier}) => {
    defaultIdentifier.replace('snap', '');
  },
});

expect.extend({toMatchImageSnapshot});
