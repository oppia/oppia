# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

"""Class to generate files in mermaidjs format."""

from __future__ import annotations

from pylint.pyreverse.printer import EdgeType, NodeProperties, NodeType, Printer
from pylint.pyreverse.utils import get_annotation_label


class MermaidJSPrinter(Printer):
    """Printer for MermaidJS diagrams."""

    DEFAULT_COLOR = "black"

    NODES: dict[NodeType, str] = {
        NodeType.CLASS: "class",
        NodeType.PACKAGE: "class",
    }
    ARROWS: dict[EdgeType, str] = {
        EdgeType.INHERITS: "--|>",
        EdgeType.COMPOSITION: "--*",
        EdgeType.ASSOCIATION: "-->",
        EdgeType.AGGREGATION: "--o",
        EdgeType.USES: "-->",
        EdgeType.TYPE_DEPENDENCY: "..>",
    }

    def _open_graph(self) -> None:
        """Emit the header lines."""
        self.emit("classDiagram")
        self._inc_indent()

    def _escape_mermaid_text(self, text: str) -> str:
        """Escape characters that conflict with Markdown formatting."""
        text = text.replace("__", r"\_\_")  # Double underscore → escaped
        return text

    def emit_node(
        self,
        name: str,
        type_: NodeType,
        properties: NodeProperties | None = None,
    ) -> None:
        """Create a new node.

        Nodes can be classes, packages, participants etc.
        """
        # pylint: disable=duplicate-code
        if properties is None:
            properties = NodeProperties(label=name)
        nodetype = self.NODES[type_]
        body = []
        if properties.attrs:
            # Escape attribute names to prevent Markdown formatting issues
            escaped_attrs = [
                self._escape_mermaid_text(attr) for attr in properties.attrs
            ]
            body.extend(escaped_attrs)
        if properties.methods:
            for func in properties.methods:
                args = self._get_method_arguments(func)
                # Escape method name and arguments
                escaped_method_name = self._escape_mermaid_text(func.name)
                escaped_args = [self._escape_mermaid_text(arg) for arg in args]
                line = f"{escaped_method_name}({', '.join(escaped_args)})"
                line += "*" if func.is_abstract() else ""
                if func.returns:
                    # Escape return type annotation
                    return_type = get_annotation_label(func.returns)
                    escaped_return_type = self._escape_mermaid_text(return_type)
                    line += f" {escaped_return_type}"
                body.append(line)
        name = name.split(".")[-1]
        self.emit(f"{nodetype} {name} {{")
        self._inc_indent()
        for line in body:
            self.emit(line)
        self._dec_indent()
        self.emit("}")
        # apply style for colored output
        if properties.color and properties.color != self.DEFAULT_COLOR:
            self.emit(f"style {name} fill:{properties.color}")

    def emit_edge(
        self,
        from_node: str,
        to_node: str,
        type_: EdgeType,
        label: str | None = None,
    ) -> None:
        """Create an edge from one node to another to display relationships."""
        from_node = from_node.split(".")[-1]
        to_node = to_node.split(".")[-1]
        edge = f"{from_node} {self.ARROWS[type_]} {to_node}"
        if label:
            edge += f" : {self._escape_mermaid_text(label)}"
        self.emit(edge)

    def _close_graph(self) -> None:
        """Emit the lines needed to properly close the graph."""
        self._dec_indent()


class HTMLMermaidJSPrinter(MermaidJSPrinter):
    """Printer for MermaidJS diagrams wrapped in a html boilerplate."""

    HTML_OPEN_BOILERPLATE = """<html>
  <body>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
      <div class="mermaid">
    """
    HTML_CLOSE_BOILERPLATE = """
       </div>
  </body>
</html>
"""
    GRAPH_INDENT_LEVEL = 4

    def _open_graph(self) -> None:
        self.emit(self.HTML_OPEN_BOILERPLATE)
        for _ in range(self.GRAPH_INDENT_LEVEL):
            self._inc_indent()
        super()._open_graph()

    def _close_graph(self) -> None:
        for _ in range(self.GRAPH_INDENT_LEVEL):
            self._dec_indent()
        self.emit(self.HTML_CLOSE_BOILERPLATE)
