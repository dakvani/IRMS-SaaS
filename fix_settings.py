with open("src/components/Settings.tsx", "r") as f:
    content = f.read()

content = content.replace("Object.entries(notifications).map(([key, prefs])", "Object.entries(notifications).map(([key, prefs]: [string, any])")

with open("src/components/Settings.tsx", "w") as f:
    f.write(content)
