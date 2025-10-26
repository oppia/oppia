# Licensed under the LGPL: https://www.gnu.org/licenses/old-licenses/lgpl-2.1.en.html
# For details: https://github.com/pylint-dev/astroid/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/astroid/blob/main/CONTRIBUTORS.txt

"""This module renders Astroid nodes as string"""

from __future__ import annotations

import warnings
from collections.abc import Iterator
from typing import TYPE_CHECKING

from astroid import nodes

if TYPE_CHECKING:
    from astroid import objects

# pylint: disable=unused-argument

DOC_NEWLINE = "\0"


# Visitor pattern require argument all the time and is not better with staticmethod
# noinspection PyUnusedLocal,PyMethodMayBeStatic
class AsStringVisitor:
    """Visitor to render an Astroid node as a valid python code string"""

    def __init__(self, indent: str = "    "):
        self.indent: str = indent

    def __call__(self, node: nodes.NodeNG) -> str:
        """Makes this visitor behave as a simple function"""
        return node.accept(self).replace(DOC_NEWLINE, "\n")

    def _docs_dedent(self, doc_node: nodes.Const | None) -> str:
        """Stop newlines in docs being indented by self._stmt_list"""
        if not doc_node:
            return ""

        return '\n{}"""{}"""'.format(
            self.indent, doc_node.value.replace("\n", DOC_NEWLINE)
        )

    def _stmt_list(self, stmts: list, indent: bool = True) -> str:
        """return a list of nodes to string"""
        stmts_str: str = "\n".join(
            nstr for nstr in [n.accept(self) for n in stmts] if nstr
        )
        if not indent:
            return stmts_str

        return self.indent + stmts_str.replace("\n", "\n" + self.indent)

    def _precedence_parens(
        self, node: nodes.NodeNG, child: nodes.NodeNG, is_left: bool = True
    ) -> str:
        """Wrap child in parens only if required to keep same semantics"""
        if self._should_wrap(node, child, is_left):
            return f"({child.accept(self)})"

        return child.accept(self)

    def _should_wrap(
        self, node: nodes.NodeNG, child: nodes.NodeNG, is_left: bool
    ) -> bool:
        """Wrap child if:
        - it has lower precedence
        - same precedence with position opposite to associativity direction
        """
        node_precedence = node.op_precedence()
        child_precedence = child.op_precedence()

        if node_precedence > child_precedence:
            # 3 * (4 + 5)
            return True

        if (
            node_precedence == child_precedence
            and is_left != node.op_left_associative()
        ):
            # 3 - (4 - 5)
            # (2**3)**4
            return True

        return False

    # visit_<node> methods ###########################################

    def visit_await(self, node: nodes.Await) -> str:
        return f"await {node.value.accept(self)}"

    def visit_asyncwith(self, node: nodes.AsyncWith) -> str:
        return f"async {self.visit_with(node)}"

    def visit_asyncfor(self, node: nodes.AsyncFor) -> str:
        return f"async {self.visit_for(node)}"

    def visit_arguments(self, node: nodes.Arguments) -> str:
        """return an nodes.Arguments node as string"""
        return node.format_args()

    def visit_assignattr(self, node: nodes.AssignAttr) -> str:
        """return an nodes.AssignAttr node as string"""
        return self.visit_attribute(node)

    def visit_assert(self, node: nodes.Assert) -> str:
        """return an nodes.Assert node as string"""
        if node.fail:
            return f"assert {node.test.accept(self)}, {node.fail.accept(self)}"
        return f"assert {node.test.accept(self)}"

    def visit_assignname(self, node: nodes.AssignName) -> str:
        """return an nodes.AssignName node as string"""
        return node.name

    def visit_assign(self, node: nodes.Assign) -> str:
        """return an nodes.Assign node as string"""
        lhs = " = ".join(n.accept(self) for n in node.targets)
        return f"{lhs} = {node.value.accept(self)}"

    def visit_augassign(self, node: nodes.AugAssign) -> str:
        """return an nodes.AugAssign node as string"""
        return f"{node.target.accept(self)} {node.op} {node.value.accept(self)}"

    def visit_annassign(self, node: nodes.AnnAssign) -> str:
        """Return an nodes.AnnAssign node as string"""

        target = node.target.accept(self)
        annotation = node.annotation.accept(self)
        if node.value is None:
            return f"{target}: {annotation}"
        return f"{target}: {annotation} = {node.value.accept(self)}"

    def visit_binop(self, node: nodes.BinOp) -> str:
        """return an nodes.BinOp node as string"""
        left = self._precedence_parens(node, node.left)
        right = self._precedence_parens(node, node.right, is_left=False)
        if node.op == "**":
            return f"{left}{node.op}{right}"

        return f"{left} {node.op} {right}"

    def visit_boolop(self, node: nodes.BoolOp) -> str:
        """return an nodes.BoolOp node as string"""
        values = [f"{self._precedence_parens(node, n)}" for n in node.values]
        return (f" {node.op} ").join(values)

    def visit_break(self, node: nodes.Break) -> str:
        """return an nodes.Break node as string"""
        return "break"

    def visit_call(self, node: nodes.Call) -> str:
        """return an nodes.Call node as string"""
        expr_str = self._precedence_parens(node, node.func)
        args = [arg.accept(self) for arg in node.args]
        if node.keywords:
            keywords = [kwarg.accept(self) for kwarg in node.keywords]
        else:
            keywords = []

        args.extend(keywords)
        return f"{expr_str}({', '.join(args)})"

    def _handle_type_params(
        self, type_params: list[nodes.TypeVar | nodes.ParamSpec | nodes.TypeVarTuple]
    ) -> str:
        return (
            f"[{', '.join(tp.accept(self) for tp in type_params)}]"
            if type_params
            else ""
        )

    def visit_classdef(self, node: nodes.ClassDef) -> str:
        """return an nodes.ClassDef node as string"""
        decorate = node.decorators.accept(self) if node.decorators else ""
        type_params = self._handle_type_params(node.type_params)
        args = [n.accept(self) for n in node.bases]
        if node._metaclass and not node.has_metaclass_hack():
            args.append("metaclass=" + node._metaclass.accept(self))
        args += [n.accept(self) for n in node.keywords]
        args_str = f"({', '.join(args)})" if args else ""
        docs = self._docs_dedent(node.doc_node)
        return "\n\n{}class {}{}{}:{}\n{}\n".format(
            decorate, node.name, type_params, args_str, docs, self._stmt_list(node.body)
        )

    def visit_compare(self, node: nodes.Compare) -> str:
        """return an nodes.Compare node as string"""
        rhs_str = " ".join(
            f"{op} {self._precedence_parens(node, expr, is_left=False)}"
            for op, expr in node.ops
        )
        return f"{self._precedence_parens(node, node.left)} {rhs_str}"

    def visit_comprehension(self, node: nodes.Comprehension) -> str:
        """return an nodes.Comprehension node as string"""
        ifs = "".join(f" if {n.accept(self)}" for n in node.ifs)
        generated = f"for {node.target.accept(self)} in {node.iter.accept(self)}{ifs}"
        return f"{'async ' if node.is_async else ''}{generated}"

    def visit_const(self, node: nodes.Const) -> str:
        """return an nodes.Const node as string"""
        if node.value is Ellipsis:
            return "..."
        return repr(node.value)

    def visit_continue(self, node: nodes.Continue) -> str:
        """return an nodes.Continue node as string"""
        return "continue"

    def visit_delete(self, node: nodes.Delete) -> str:
        """return an nodes.Delete node as string"""
        return f"del {', '.join(child.accept(self) for child in node.targets)}"

    def visit_delattr(self, node: nodes.DelAttr) -> str:
        """return an nodes.DelAttr node as string"""
        return self.visit_attribute(node)

    def visit_delname(self, node: nodes.DelName) -> str:
        """return an nodes.DelName node as string"""
        return node.name

    def visit_decorators(self, node: nodes.Decorators) -> str:
        """return an nodes.Decorators node as string"""
        return "@%s\n" % "\n@".join(item.accept(self) for item in node.nodes)

    def visit_dict(self, node: nodes.Dict) -> str:
        """return an nodes.Dict node as string"""
        return "{%s}" % ", ".join(self._visit_dict(node))

    def _visit_dict(self, node: nodes.Dict) -> Iterator[str]:
        for key, value in node.items:
            key = key.accept(self)
            value = value.accept(self)
            if key == "**":
                # It can only be a DictUnpack node.
                yield key + value
            else:
                yield f"{key}: {value}"

    def visit_dictunpack(self, node: nodes.DictUnpack) -> str:
        return "**"

    def visit_dictcomp(self, node: nodes.DictComp) -> str:
        """return an nodes.DictComp node as string"""
        return "{{{}: {} {}}}".format(
            node.key.accept(self),
            node.value.accept(self),
            " ".join(n.accept(self) for n in node.generators),
        )

    def visit_expr(self, node: nodes.Expr) -> str:
        """return an nodes.Expr node as string"""
        return node.value.accept(self)

    def visit_emptynode(self, node: nodes.EmptyNode) -> str:
        """dummy method for visiting an EmptyNode"""
        return ""

    def visit_excepthandler(self, node: nodes.ExceptHandler) -> str:
        n = "except"
        if isinstance(getattr(node, "parent", None), nodes.TryStar):
            n = "except*"
        if node.type:
            if node.name:
                excs = f"{n} {node.type.accept(self)} as {node.name.accept(self)}"
            else:
                excs = f"{n} {node.type.accept(self)}"
        else:
            excs = f"{n}"
        return f"{excs}:\n{self._stmt_list(node.body)}"

    def visit_empty(self, node: nodes.EmptyNode) -> str:
        """return an EmptyNode as string"""
        return ""

    def visit_for(self, node: nodes.For) -> str:
        """return an nodes.For node as string"""
        fors = "for {} in {}:\n{}".format(
            node.target.accept(self), node.iter.accept(self), self._stmt_list(node.body)
        )
        if node.orelse:
            fors = f"{fors}\nelse:\n{self._stmt_list(node.orelse)}"
        return fors

    def visit_importfrom(self, node: nodes.ImportFrom) -> str:
        """return an nodes.ImportFrom node as string"""
        return "from {} import {}".format(
            "." * (node.level or 0) + node.modname, _import_string(node.names)
        )

    def visit_joinedstr(self, node: nodes.JoinedStr) -> str:
        string = "".join(
            # Use repr on the string literal parts
            # to get proper escapes, e.g. \n, \\, \"
            # But strip the quotes off the ends
            # (they will always be one character: ' or ")
            (
                repr(value.value)[1:-1]
                # Literal braces must be doubled to escape them
                .replace("{", "{{").replace("}", "}}")
                # Each value in values is either a string literal (Const)
                # or a FormattedValue
                if type(value).__name__ == "Const"
                else value.accept(self)
            )
            for value in node.values
        )

        # Try to find surrounding quotes that don't appear at all in the string.
        # Because the formatted values inside {} can't contain backslash (\)
        # using a triple quote is sometimes necessary
        for quote in ("'", '"', '"""', "'''"):
            if quote not in string:
                break

        return "f" + quote + string + quote

    def visit_formattedvalue(self, node: nodes.FormattedValue) -> str:
        result = node.value.accept(self)
        if node.conversion and node.conversion >= 0:
            # e.g. if node.conversion == 114: result += "!r"
            result += "!" + chr(node.conversion)
        if node.format_spec:
            # The format spec is itself a JoinedString, i.e. an f-string
            # We strip the f and quotes of the ends
            result += ":" + node.format_spec.accept(self)[2:-1]
        return "{%s}" % result

    def handle_functiondef(self, node: nodes.FunctionDef, keyword: str) -> str:
        """return a (possibly async) function definition node as string"""
        decorate = node.decorators.accept(self) if node.decorators else ""
        type_params = self._handle_type_params(node.type_params)
        docs = self._docs_dedent(node.doc_node)
        trailer = ":"
        if node.returns:
            return_annotation = " -> " + node.returns.as_string()
            trailer = return_annotation + ":"
        def_format = "\n%s%s %s%s(%s)%s%s\n%s"
        return def_format % (
            decorate,
            keyword,
            node.name,
            type_params,
            node.args.accept(self),
            trailer,
            docs,
            self._stmt_list(node.body),
        )

    def visit_functiondef(self, node: nodes.FunctionDef) -> str:
        """return an nodes.FunctionDef node as string"""
        return self.handle_functiondef(node, "def")

    def visit_asyncfunctiondef(self, node: nodes.AsyncFunctionDef) -> str:
        """return an nodes.AsyncFunction node as string"""
        return self.handle_functiondef(node, "async def")

    def visit_generatorexp(self, node: nodes.GeneratorExp) -> str:
        """return an nodes.GeneratorExp node as string"""
        return "({} {})".format(
            node.elt.accept(self), " ".join(n.accept(self) for n in node.generators)
        )

    def visit_attribute(
        self, node: nodes.Attribute | nodes.AssignAttr | nodes.DelAttr
    ) -> str:
        """return an nodes.Attribute node as string"""
        try:
            left = self._precedence_parens(node, node.expr)
        except RecursionError:
            warnings.warn(
                "Recursion limit exhausted; defaulting to adding parentheses.",
                UserWarning,
                stacklevel=2,
            )
            left = f"({node.expr.accept(self)})"
        if left.isdigit():
            left = f"({left})"
        return f"{left}.{node.attrname}"

    def visit_global(self, node: nodes.Global) -> str:
        """return an nodes.Global node as string"""
        return f"global {', '.join(node.names)}"

    def visit_if(self, node: nodes.If) -> str:
        """return an nodes.If node as string"""
        ifs = [f"if {node.test.accept(self)}:\n{self._stmt_list(node.body)}"]
        if node.has_elif_block():
            ifs.append(f"el{self._stmt_list(node.orelse, indent=False)}")
        elif node.orelse:
            ifs.append(f"else:\n{self._stmt_list(node.orelse)}")
        return "\n".join(ifs)

    def visit_ifexp(self, node: nodes.IfExp) -> str:
        """return an nodes.IfExp node as string"""
        return "{} if {} else {}".format(
            self._precedence_parens(node, node.body, is_left=True),
            self._precedence_parens(node, node.test, is_left=True),
            self._precedence_parens(node, node.orelse, is_left=False),
        )

    def visit_import(self, node: nodes.Import) -> str:
        """return an nodes.Import node as string"""
        return f"import {_import_string(node.names)}"

    def visit_keyword(self, node: nodes.Keyword) -> str:
        """return an nodes.Keyword node as string"""
        if node.arg is None:
            return f"**{node.value.accept(self)}"
        return f"{node.arg}={node.value.accept(self)}"

    def visit_lambda(self, node: nodes.Lambda) -> str:
        """return an nodes.Lambda node as string"""
        args = node.args.accept(self)
        body = node.body.accept(self)
        if args:
            return f"lambda {args}: {body}"

        return f"lambda: {body}"

    def visit_list(self, node: nodes.List) -> str:
        """return an nodes.List node as string"""
        return f"[{', '.join(child.accept(self) for child in node.elts)}]"

    def visit_listcomp(self, node: nodes.ListComp) -> str:
        """return an nodes.ListComp node as string"""
        return "[{} {}]".format(
            node.elt.accept(self), " ".join(n.accept(self) for n in node.generators)
        )

    def visit_module(self, node: nodes.Module) -> str:
        """return an nodes.Module node as string"""
        docs = f'"""{node.doc_node.value}"""\n\n' if node.doc_node else ""
        return docs + "\n".join(n.accept(self) for n in node.body) + "\n\n"

    def visit_name(self, node: nodes.Name) -> str:
        """return an nodes.Name node as string"""
        return node.name

    def visit_namedexpr(self, node: nodes.NamedExpr) -> str:
        """Return an assignment expression node as string"""
        target = node.target.accept(self)
        value = node.value.accept(self)
        return f"{target} := {value}"

    def visit_nonlocal(self, node: nodes.Nonlocal) -> str:
        """return an nodes.Nonlocal node as string"""
        return f"nonlocal {', '.join(node.names)}"

    def visit_paramspec(self, node: nodes.ParamSpec) -> str:
        """return an nodes.ParamSpec node as string"""
        default_value_str = (
            f" = {node.default_value.accept(self)}" if node.default_value else ""
        )
        return f"**{node.name.accept(self)}{default_value_str}"

    def visit_pass(self, node: nodes.Pass) -> str:
        """return an nodes.Pass node as string"""
        return "pass"

    def visit_partialfunction(self, node: objects.PartialFunction) -> str:
        """Return an objects.PartialFunction as string."""
        return self.visit_functiondef(node)

    def visit_raise(self, node: nodes.Raise) -> str:
        """return an nodes.Raise node as string"""
        if node.exc:
            if node.cause:
                return f"raise {node.exc.accept(self)} from {node.cause.accept(self)}"
            return f"raise {node.exc.accept(self)}"
        return "raise"

    def visit_return(self, node: nodes.Return) -> str:
        """return an nodes.Return node as string"""
        if node.is_tuple_return() and len(node.value.elts) > 1:
            elts = [child.accept(self) for child in node.value.elts]
            return f"return {', '.join(elts)}"

        if node.value:
            return f"return {node.value.accept(self)}"

        return "return"

    def visit_set(self, node: nodes.Set) -> str:
        """return an nodes.Set node as string"""
        return "{%s}" % ", ".join(child.accept(self) for child in node.elts)

    def visit_setcomp(self, node: nodes.SetComp) -> str:
        """return an nodes.SetComp node as string"""
        return "{{{} {}}}".format(
            node.elt.accept(self), " ".join(n.accept(self) for n in node.generators)
        )

    def visit_slice(self, node: nodes.Slice) -> str:
        """return an nodes.Slice node as string"""
        lower = node.lower.accept(self) if node.lower else ""
        upper = node.upper.accept(self) if node.upper else ""
        step = node.step.accept(self) if node.step else ""
        if step:
            return f"{lower}:{upper}:{step}"
        return f"{lower}:{upper}"

    def visit_subscript(self, node: nodes.Subscript) -> str:
        """return an nodes.Subscript node as string"""
        idx = node.slice
        if idx.__class__.__name__.lower() == "index":
            idx = idx.value
        idxstr = idx.accept(self)
        if idx.__class__.__name__.lower() == "tuple" and idx.elts:
            # Remove parenthesis in tuple and extended slice.
            # a[(::1, 1:)] is not valid syntax.
            idxstr = idxstr[1:-1]
        return f"{self._precedence_parens(node, node.value)}[{idxstr}]"

    def visit_try(self, node: nodes.Try) -> str:
        """return an nodes.Try node as string"""
        trys = [f"try:\n{self._stmt_list(node.body)}"]
        for handler in node.handlers:
            trys.append(handler.accept(self))
        if node.orelse:
            trys.append(f"else:\n{self._stmt_list(node.orelse)}")
        if node.finalbody:
            trys.append(f"finally:\n{self._stmt_list(node.finalbody)}")
        return "\n".join(trys)

    def visit_trystar(self, node: nodes.TryStar) -> str:
        """return an nodes.TryStar node as string"""
        trys = [f"try:\n{self._stmt_list(node.body)}"]
        for handler in node.handlers:
            trys.append(handler.accept(self))
        if node.orelse:
            trys.append(f"else:\n{self._stmt_list(node.orelse)}")
        if node.finalbody:
            trys.append(f"finally:\n{self._stmt_list(node.finalbody)}")
        return "\n".join(trys)

    def visit_tuple(self, node: nodes.Tuple) -> str:
        """return an nodes.Tuple node as string"""
        if len(node.elts) == 1:
            return f"({node.elts[0].accept(self)}, )"
        return f"({', '.join(child.accept(self) for child in node.elts)})"

    def visit_typealias(self, node: nodes.TypeAlias) -> str:
        """return an nodes.TypeAlias node as string"""
        type_params = self._handle_type_params(node.type_params)
        return f"type {node.name.accept(self)}{type_params} = {node.value.accept(self)}"

    def visit_typevar(self, node: nodes.TypeVar) -> str:
        """return an nodes.TypeVar node as string"""
        bound_str = f": {node.bound.accept(self)}" if node.bound else ""
        default_value_str = (
            f" = {node.default_value.accept(self)}" if node.default_value else ""
        )
        return f"{node.name.accept(self)}{bound_str}{default_value_str}"

    def visit_typevartuple(self, node: nodes.TypeVarTuple) -> str:
        """return an nodes.TypeVarTuple node as string"""
        default_value_str = (
            f" = {node.default_value.accept(self)}" if node.default_value else ""
        )
        return f"*{node.name.accept(self)}{default_value_str}"

    def visit_unaryop(self, node: nodes.UnaryOp) -> str:
        """return an nodes.UnaryOp node as string"""
        if node.op == "not":
            operator = "not "
        else:
            operator = node.op
        return f"{operator}{self._precedence_parens(node, node.operand)}"

    def visit_while(self, node: nodes.While) -> str:
        """return an nodes.While node as string"""
        whiles = f"while {node.test.accept(self)}:\n{self._stmt_list(node.body)}"
        if node.orelse:
            whiles = f"{whiles}\nelse:\n{self._stmt_list(node.orelse)}"
        return whiles

    def visit_with(self, node: nodes.With) -> str:  # 'with' without 'as' is possible
        """return an nodes.With node as string"""
        items = ", ".join(
            f"{expr.accept(self)}" + ((v and f" as {v.accept(self)}") or "")
            for expr, v in node.items
        )
        return f"with {items}:\n{self._stmt_list(node.body)}"

    def visit_yield(self, node: nodes.Yield) -> str:
        """yield an ast.Yield node as string"""
        yi_val = (" " + node.value.accept(self)) if node.value else ""
        expr = "yield" + yi_val
        if node.parent.is_statement:
            return expr

        return f"({expr})"

    def visit_yieldfrom(self, node: nodes.YieldFrom) -> str:
        """Return an nodes.YieldFrom node as string."""
        yi_val = (" " + node.value.accept(self)) if node.value else ""
        expr = "yield from" + yi_val
        if node.parent.is_statement:
            return expr

        return f"({expr})"

    def visit_starred(self, node: nodes.Starred) -> str:
        """return Starred node as string"""
        return "*" + node.value.accept(self)

    def visit_match(self, node: nodes.Match) -> str:
        """Return an nodes.Match node as string."""
        return f"match {node.subject.accept(self)}:\n{self._stmt_list(node.cases)}"

    def visit_matchcase(self, node: nodes.MatchCase) -> str:
        """Return an nodes.MatchCase node as string."""
        guard_str = f" if {node.guard.accept(self)}" if node.guard else ""
        return (
            f"case {node.pattern.accept(self)}{guard_str}:\n"
            f"{self._stmt_list(node.body)}"
        )

    def visit_matchvalue(self, node: nodes.MatchValue) -> str:
        """Return an nodes.MatchValue node as string."""
        return node.value.accept(self)

    @staticmethod
    def visit_matchsingleton(node: nodes.MatchSingleton) -> str:
        """Return an nodes.MatchSingleton node as string."""
        return str(node.value)

    def visit_matchsequence(self, node: nodes.MatchSequence) -> str:
        """Return an nodes.MatchSequence node as string."""
        if node.patterns is None:
            return "[]"
        return f"[{', '.join(p.accept(self) for p in node.patterns)}]"

    def visit_matchmapping(self, node: nodes.MatchMapping) -> str:
        """Return an nodes..MatchMapping node as string."""
        mapping_strings: list[str] = []
        if node.keys and node.patterns:
            mapping_strings.extend(
                f"{key.accept(self)}: {p.accept(self)}"
                for key, p in zip(node.keys, node.patterns)
            )
        if node.rest:
            mapping_strings.append(f"**{node.rest.accept(self)}")
        return f"{'{'}{', '.join(mapping_strings)}{'}'}"

    def visit_matchclass(self, node: nodes.MatchClass) -> str:
        """Return an nodes..MatchClass node as string."""
        if node.cls is None:
            raise AssertionError(f"{node} does not have a 'cls' node")
        class_strings: list[str] = []
        if node.patterns:
            class_strings.extend(p.accept(self) for p in node.patterns)
        if node.kwd_attrs and node.kwd_patterns:
            for attr, pattern in zip(node.kwd_attrs, node.kwd_patterns):
                class_strings.append(f"{attr}={pattern.accept(self)}")
        return f"{node.cls.accept(self)}({', '.join(class_strings)})"

    def visit_matchstar(self, node: nodes.MatchStar) -> str:
        """Return an nodes..MatchStar node as string."""
        return f"*{node.name.accept(self) if node.name else '_'}"

    def visit_matchas(self, node: nodes.MatchAs) -> str:
        """Return an nodes..MatchAs node as string."""
        if isinstance(
            node.parent, (nodes.MatchSequence, nodes.MatchMapping, nodes.MatchClass)
        ):
            return node.name.accept(self) if node.name else "_"
        return (
            f"{node.pattern.accept(self) if node.pattern else '_'}"
            f"{f' as {node.name.accept(self)}' if node.name else ''}"
        )

    def visit_matchor(self, node: nodes.MatchOr) -> str:
        """Return an nodes.MatchOr node as string."""
        if node.patterns is None:
            raise AssertionError(f"{node} does not have pattern nodes")
        return " | ".join(p.accept(self) for p in node.patterns)

    def visit_templatestr(self, node: nodes.TemplateStr) -> str:
        """Return an nodes.TemplateStr node as string."""
        string = ""
        for value in node.values:
            match value:
                case nodes.Interpolation():
                    string += "{" + value.accept(self) + "}"
                case _:
                    string += value.accept(self)[1:-1]
        for quote in ("'", '"', '"""', "'''"):
            if quote not in string:
                break
        return "t" + quote + string + quote

    def visit_interpolation(self, node: nodes.Interpolation) -> str:
        """Return an nodes.Interpolation node as string."""
        result = f"{node.str}"
        if node.conversion and node.conversion >= 0:
            # e.g. if node.conversion == 114: result += "!r"
            result += "!" + chr(node.conversion)
        if node.format_spec:
            # The format spec is itself a JoinedString, i.e. an f-string
            # We strip the f and quotes of the ends
            result += ":" + node.format_spec.accept(self)[2:-1]
        return result

    # These aren't for real AST nodes, but for inference objects.

    def visit_frozenset(self, node: objects.FrozenSet) -> str:
        return node.parent.accept(self)

    def visit_super(self, node: objects.Super) -> str:
        return node.parent.accept(self)

    def visit_uninferable(self, node) -> str:
        return str(node)

    def visit_property(self, node: objects.Property) -> str:
        return node.function.accept(self)

    def visit_evaluatedobject(self, node: nodes.EvaluatedObject) -> str:
        return node.original.accept(self)

    def visit_unknown(self, node: nodes.Unknown) -> str:
        return str(node)


def _import_string(names: list[tuple[str, str | None]]) -> str:
    """return a list of (name, asname) formatted as a string"""
    _names = []
    for name, asname in names:
        if asname is not None:
            _names.append(f"{name} as {asname}")
        else:
            _names.append(name)
    return ", ".join(_names)


# This sets the default indent to 4 spaces.
to_code = AsStringVisitor("    ")
