# Licensed under the GPL: https://www.gnu.org/licenses/old-licenses/gpl-2.0.html
# For details: https://github.com/pylint-dev/pylint/blob/main/LICENSE
# Copyright (c) https://github.com/pylint-dev/pylint/blob/main/CONTRIBUTORS.txt

"""Create UML diagrams for classes and modules in <packages>."""

from __future__ import annotations

import sys
from collections.abc import Sequence

from pylint import constants
from pylint.config.arguments_manager import _ArgumentsManager
from pylint.config.arguments_provider import _ArgumentsProvider
from pylint.lint import discover_package_path
from pylint.lint.utils import augmented_sys_path
from pylint.pyreverse import writer
from pylint.pyreverse.diadefslib import DiadefsHandler
from pylint.pyreverse.inspector import Linker, project_from_files
from pylint.pyreverse.utils import (
    check_graphviz_availability,
    check_if_graphviz_supports_format,
    insert_default_options,
)
from pylint.typing import Options

DIRECTLY_SUPPORTED_FORMATS = (
    "dot",
    "puml",
    "plantuml",
    "mmd",
    "html",
)

DEFAULT_COLOR_PALETTE = (
    # colorblind scheme taken from https://personal.sron.nl/~pault/
    "#77AADD",  # light blue
    "#99DDFF",  # light cyan
    "#44BB99",  # mint
    "#BBCC33",  # pear
    "#AAAA00",  # olive
    "#EEDD88",  # light yellow
    "#EE8866",  # orange
    "#FFAABB",  # pink
    "#DDDDDD",  # pale grey
)


OPTIONS_GROUPS = {
    "FILTERING": "Filtering and Scope",
    "DISPLAY": "Display Options",
    "OUTPUT": "Output Control",
    "PROJECT": "Project Configuration",
}


OPTIONS: Options = (
    # Filtering and Scope options
    (
        "filter-mode",
        {
            "short": "f",
            "default": "PUB_ONLY",
            "dest": "mode",
            "type": "string",
            "action": "store",
            "metavar": "<mode>",
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": """Filter attributes and functions according to <mode>. Correct modes are:
'PUB_ONLY' filter all non public attributes [DEFAULT], equivalent to PRIVATE+SPECIAL
'ALL' no filter
'SPECIAL' filter Python special functions except constructor
'OTHER' filter protected and private attributes""",
        },
    ),
    (
        "class",
        {
            "short": "c",
            "action": "extend",
            "metavar": "<class>",
            "type": "csv",
            "dest": "classes",
            "default": None,
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": "Create a class diagram with all classes related to <class>;\
 this uses by default the options -ASmy",
        },
    ),
    (
        "show-ancestors",
        {
            "short": "a",
            "action": "store",
            "metavar": "<ancestor>",
            "type": "int",
            "default": None,
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": "Show <ancestor> generations of ancestor classes not in <projects>.",
        },
    ),
    (
        "all-ancestors",
        {
            "short": "A",
            "default": None,
            "action": "store_true",
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": "Show all ancestors of all classes in <projects>.",
        },
    ),
    (
        "show-associated",
        {
            "short": "s",
            "action": "store",
            "metavar": "<association_level>",
            "type": "int",
            "default": None,
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": "Show <association_level> levels of associated classes not in <projects>.",
        },
    ),
    (
        "all-associated",
        {
            "short": "S",
            "default": None,
            "action": "store_true",
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": "Show all classes associated with the target classes, including indirect associations.",
        },
    ),
    (
        "show-builtin",
        {
            "short": "b",
            "action": "store_true",
            "default": False,
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": "Include builtin objects in representation of classes.",
        },
    ),
    (
        "show-stdlib",
        {
            "short": "L",
            "action": "store_true",
            "default": False,
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": "Include standard library objects in representation of classes.",
        },
    ),
    (
        "max-depth",
        {
            "dest": "max_depth",
            "action": "store",
            "default": None,
            "metavar": "<depth>",
            "type": "int",
            "group": OPTIONS_GROUPS["FILTERING"],
            "help": (
                "Maximum depth of packages/modules to include in the diagram, relative to the "
                "deepest specified package. A depth of 0 shows only the specified packages/modules, "
                "while 1 includes their immediate children, etc. When specifying nested packages,  "
                "depth is calculated from the deepest package level. If not specified, all "
                "packages/modules in the hierarchy are shown."
            ),
        },
    ),
    # Display Options
    (
        "module-names",
        {
            "short": "m",
            "default": None,
            "type": "yn",
            "metavar": "<y or n>",
            "group": OPTIONS_GROUPS["DISPLAY"],
            "help": "Include module name in the representation of classes.",
        },
    ),
    (
        "only-classnames",
        {
            "short": "k",
            "action": "store_true",
            "default": False,
            "group": OPTIONS_GROUPS["DISPLAY"],
            "help": "Don't show attributes and methods in the class boxes; this disables -f values.",
        },
    ),
    (
        "no-standalone",
        {
            "action": "store_true",
            "default": False,
            "group": OPTIONS_GROUPS["DISPLAY"],
            "help": "Only show nodes with connections.",
        },
    ),
    (
        "colorized",
        {
            "dest": "colorized",
            "action": "store_true",
            "default": False,
            "group": OPTIONS_GROUPS["DISPLAY"],
            "help": "Use colored output. Classes/modules of the same package get the same color.",
        },
    ),
    (
        "max-color-depth",
        {
            "dest": "max_color_depth",
            "action": "store",
            "default": 2,
            "metavar": "<depth>",
            "type": "int",
            "group": OPTIONS_GROUPS["DISPLAY"],
            "help": "Use separate colors up to package depth of <depth>. Higher depths will reuse colors.",
        },
    ),
    (
        "color-palette",
        {
            "dest": "color_palette",
            "action": "store",
            "default": DEFAULT_COLOR_PALETTE,
            "metavar": "<color1,color2,...>",
            "type": "csv",
            "group": OPTIONS_GROUPS["DISPLAY"],
            "help": "Comma separated list of colors to use for the package depth coloring.",
        },
    ),
    # Output Control options
    (
        "output",
        {
            "short": "o",
            "dest": "output_format",
            "action": "store",
            "default": "dot",
            "metavar": "<format>",
            "type": "string",
            "group": OPTIONS_GROUPS["OUTPUT"],
            "help": (
                "Create a *.<format> output file if format is available. Available "
                f"formats are: {', '.join('.' + fmt for fmt in DIRECTLY_SUPPORTED_FORMATS)}. Any other "
                "format will be tried to be created by using the 'dot' command line "
                "tool, which requires a graphviz installation. In this case, these additional "
                "formats are available (see `Graphviz output formats <https://graphviz.org/docs/outputs/>`_)."
            ),
        },
    ),
    (
        "output-directory",
        {
            "default": "",
            "type": "path",
            "short": "d",
            "action": "store",
            "metavar": "<output_directory>",
            "group": OPTIONS_GROUPS["OUTPUT"],
            "help": "Set the output directory path.",
        },
    ),
    # Project Configuration options
    (
        "ignore",
        {
            "type": "csv",
            "metavar": "<file[,file...]>",
            "dest": "ignore_list",
            "default": constants.DEFAULT_IGNORE_LIST,
            "group": OPTIONS_GROUPS["PROJECT"],
            "help": "Files or directories to be skipped. They should be base names, not paths.",
        },
    ),
    (
        "project",
        {
            "default": "",
            "type": "string",
            "short": "p",
            "metavar": "<project name>",
            "group": OPTIONS_GROUPS["PROJECT"],
            "help": "Set the project name. This will later be appended to the output file names.",
        },
    ),
    (
        "source-roots",
        {
            "type": "glob_paths_csv",
            "metavar": "<path>[,<path>...]",
            "default": (),
            "group": OPTIONS_GROUPS["PROJECT"],
            "help": "Add paths to the list of the source roots. Supports globbing patterns. The "
            "source root is an absolute path or a path relative to the current working directory "
            "used to determine a package namespace for modules located under the source root.",
        },
    ),
    (
        "verbose",
        {
            "action": "store_true",
            "default": False,
            "group": OPTIONS_GROUPS["PROJECT"],
            "help": "Makes pyreverse more verbose/talkative. Mostly useful for debugging.",
        },
    ),
)


# Base class providing common behaviour for pyreverse commands
class Run(_ArgumentsManager, _ArgumentsProvider):
    options = OPTIONS
    name = "pyreverse"

    def __init__(self, args: Sequence[str]) -> None:
        # Immediately exit if user asks for version
        if "--version" in args:
            print("pyreverse is included in pylint:")
            print(constants.full_version)
            sys.exit(0)

        _ArgumentsManager.__init__(self, prog="pyreverse", description=__doc__)
        _ArgumentsProvider.__init__(self, self)

        # Parse options
        insert_default_options()
        self.args = self._parse_command_line_configuration(args)

        if self.config.output_format not in DIRECTLY_SUPPORTED_FORMATS:
            check_graphviz_availability()
            print(
                f"Format {self.config.output_format} is not supported natively."
                " Pyreverse will try to generate it using Graphviz..."
            )
            check_if_graphviz_supports_format(self.config.output_format)

    def run(self) -> int:
        """Checking arguments and run project."""
        if not self.args:
            print(self.help())
            return 1
        extra_packages_paths = list(
            {discover_package_path(arg, self.config.source_roots) for arg in self.args}
        )
        with augmented_sys_path(extra_packages_paths):
            project = project_from_files(
                self.args,
                project_name=self.config.project,
                black_list=self.config.ignore_list,
                verbose=self.config.verbose,
            )
            linker = Linker(project, tag=True)
            handler = DiadefsHandler(self.config, self.args)
            diadefs = handler.get_diadefs(project, linker)
        writer.DiagramWriter(self.config).write(diadefs)
        return 0


if __name__ == "__main__":
    arguments = sys.argv[1:]
    Run(arguments).run()
