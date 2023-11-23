module.exports = {
  create(context) {
    return {
      ImportDeclaration(node) {
        if (node.source.value === 'fs') {
          context.report({
            node,
            message: 'Do not import the fs module directly.',
          });
        }
      },
    };
  },
};
