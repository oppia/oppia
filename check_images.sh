if docker ps -a --format={{.Image}} | grep -q "oppia-dev-server" || docker ps -a --format={{.Image}} | grep -q "oppia-angular-build"; then
    echo "Stopping Oppia containers..."
fi