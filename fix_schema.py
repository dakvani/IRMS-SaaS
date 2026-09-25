with open("src/db/schema.ts", "r") as f:
    content = f.read()

replacement = """
  warrantyExpiry: date("warranty_expiry"),
  insuranceExpiry: date("insurance_expiry"),
  registrationExpiry: date("registration_expiry"),
  inspectionExpiry: date("inspection_expiry"),
  status: text('status').default('available').notNull(), // available, assigned, maintenance, retired
"""

if "warrantyExpiry: date(\"warranty_expiry\")," in content:
    content = content.replace("  warrantyExpiry: date(\"warranty_expiry\"),\n    status: text('status').default('available').notNull(), // available, assigned, maintenance, retired", replacement.strip())
    
with open("src/db/schema.ts", "w") as f:
    f.write(content)
