with open("src/components/Employees.tsx", "r") as f:
    lines = f.readlines()

out_lines = []
skip = False
funcs_found = 0

for line in lines:
    if "const handleOpenAssignAsset =" in line:
        funcs_found += 1
        if funcs_found == 2:
            skip = True
    
    if skip:
        if "  const handleUnassignAsset = " in line:
            skip = False
        else:
            continue
            
    out_lines.append(line)

with open("src/components/Employees.tsx", "w") as f:
    f.writelines(out_lines)
print("done")
