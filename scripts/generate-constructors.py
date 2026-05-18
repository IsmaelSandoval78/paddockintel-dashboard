name: Generate f1-constructors.js from CSV

on:
  push:
    paths:
      - 'src/data/constructors.csv'
      - 'src/data/constructor_standings.csv'
      - 'src/data/constructor_results.csv'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run generator script
        run: python3 scripts/generate-constructors.py

      - name: Commit generated file
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add src/data/f1-constructors.js
          git diff --staged --quiet || git commit -m "auto: regenerate f1-constructors.js from CSV"
          git push
