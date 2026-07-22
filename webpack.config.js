module.exports = {
  resolve: {
    fallback: {
      assert: require.resolve('assert/'),
      util: require.resolve('util/'),
    },
  },
};
