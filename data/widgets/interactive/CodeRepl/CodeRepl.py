from data.objects.models import objects
from oppia.domain import widget_domain


class CodeRepl(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered from apps/widget/models.py when the default widgets are
    refreshed.
    
    TODO:
      Add jsrepl to the repository.
      write tests in data/objects/models/objects_test.py.
      Make selection of prog language a drop down in expl editor.
      Add option to tell if the code is one line or multiple lines?
      Add more rules and tests for them.
        Rules for output, error, and evaluation.
      Sample exploration.
      Allow the widget to be sticky?
    """

    # The human-readable name of the widget.
    name = 'Code REPL'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'Programming code widget with read-evaluate-print loop.')

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'language',
        'description': 'Programming language to evalue the code in.',
        'obj_type': 'UnicodeString',
        'values': [
          'bloop', 'brainfuck', 'coffeescript', 'emoticon', 'forth',
          'javascript', 'kaffeine', 'lolcode', 'lua', 'move', 'python',
          'qbasic', 'roy', 'ruby', 'scheme', 'traceur', 'unlambda'
        ]
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'input_type': objects.CodeEvaluation
    }]
