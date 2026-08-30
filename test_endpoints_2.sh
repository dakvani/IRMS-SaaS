#!/bin/bash
endpoints=(
  "/api/edit-requests/1/approve" 
  "/api/employees/1" 
  "/api/employees/1/approve" 
  "/api/users/1/role"
)

for endpoint in "${endpoints[@]}"; do
  output=$(curl -s -X PUT -H "Authorization: Bearer mock" http://localhost:3000$endpoint | head -c 20)
  if [[ "$output" == "<!doctype"* ]] || [[ "$output" == "<!DOCTYPE"* ]] || [[ "$output" == "<html"* ]]; then
    echo "$endpoint returns HTML"
  fi
done
