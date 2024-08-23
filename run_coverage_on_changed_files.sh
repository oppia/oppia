# Get the list of changed Python files
changed_files=$(git diff --name-only --diff-filter=ACM HEAD~1 HEAD | grep -E '\.py$')

if [ -z "$changed_files" ]; then
  echo "No Python files have changed."
  exit 0
fi

coverage run --source=. -m unittest discover

coverage report --include=$(echo $changed_files | tr ' ' ',')

coverage html --include=$(echo $changed_files | tr ' ' ',')
