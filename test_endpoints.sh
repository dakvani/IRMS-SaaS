#!/bin/bash
endpoints=(
  "/api/rooms" "/api/accommodations" "/api/timesheets" "/api/sites" "/api/assignments" 
  "/api/leaves" "/api/employees" "/api/assets" "/api/audit-logs" "/api/projects" 
  "/api/dashboard/stats" "/api/edit-requests" "/api/vehicles" "/api/me" "/api/organization" 
  "/api/users" "/api/trainings/courses" "/api/trainings/employee" "/api/employee-documents"
)

for endpoint in "${endpoints[@]}"; do
  output=$(curl -s -H "Authorization: Bearer mock" http://localhost:3000$endpoint | head -c 20)
  if [[ "$output" == "<!doctype"* ]] || [[ "$output" == "<!DOCTYPE"* ]] || [[ "$output" == "<html"* ]]; then
    echo "$endpoint returns HTML"
  fi
done
