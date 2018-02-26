# Assumptions: No two functions have the same function name.
# import astroid
from pylint.checkers import BaseChecker
from pylint.interfaces import IAstroidChecker


class ExplicitKwargsChecker(BaseChecker):
    __implements__ = IAstroidChecker

    name = 'explicit-kwargs'
    priority = -1
    msgs = {
        'C0001': (
            'Calls keywords arguments non-explicitly',
            'non-explicit-kwargs',
            'All keyword arguments should be named explicitly in function call.'
        ),
    }

    def __init__(self, linter=None):
        super(ExplicitKwargsChecker, self).__init__(linter)
        self._function_name = None
        self._defaults_count = 0

    def visit_functiondef(self, node):
        self._function_name = node.name

    def visit_arguments(self, node):
        self._defaults_count = len(node.defaults)

    def visit_call(self, node):
        if node.func.name == self._function_name:
            if len(node.keywords) != self._defaults_count:
                self.add_message('non-explicit-kwargs', node=node)
            else:
                return
        else:
            return


def register(linter):
    linter.register_checker(ExplicitKwargsChecker(linter))
