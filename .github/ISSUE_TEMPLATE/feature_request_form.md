name: Simplified Feature request form
description: Suggest an idea for this project
title: "[Feature Request]: "
labels: ["triage needed", "enhancement"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to report a bug in the Oppia project.
  - type: checkboxes
    attributes:
      label: Is there an existing issue for this?
      description: Before filing a new issue, please do a quick search to check that it hasn't already been filed on the [issue tracker](https://github.com/oppia/oppia/issues).
      options:
      - label: I have searched the existing issues
        required: true
  - type: textarea
    id: problem
    attributes:
      label: A clear and concise description of what you want to happen.
      description: A clear and concise description of what the problem is.
      placeholder: I'm always frustrated when ...
    validations:
      required: true
  - type: textarea
    id: solution
    attributes:
      label: Describe the solution you'd like
      description: A clear and concise description of what you want to happen.
      placeholder: I want ...
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Describe alternatives you've considered
      description: A clear and concise description of any alternative solutions or features you've considered.
      placeholder: I have also considered ...
    validations:
      required: false
  - type: textarea
    id: additional-context
    attributes:
      label: Additional context
      description: |
        Add any other context or screenshots about the feature request here.

        Tip: You can attach images or log files by clicking this area to highlight it and then dragging files in.
    validations:
      required: false
