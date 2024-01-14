#!/bin/sh

if curl -f http://localhost:8181/; then  
  # Healthy - update label
  docker container update --label-add HEALTHY=true oppia-dev-server
  exit 0
else
  exit 1
fi