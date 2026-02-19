---
name: workout-chart
description: "Generates a monthly workout frequency bar chart (PNG) from the PostgreSQL database. Use when the user asks to visualise, chart, graph, or plot workout data/history/activity over the past year. Reads DATABASE_URL from the project .env file and exports an image."
---

# Workout Chart Skill

## What This Skill Does

Queries the `workouts` table for the past 12 months, counts workouts per month, and exports
a bar chart as a PNG image using `scripts/workout_chart.py`.

## Dependencies

The script auto-installs missing packages on first run (`psycopg2-binary`, `matplotlib`).
No manual setup required.

## Running the Script

From the project root directory:

```bash
python3 .claude/skills/workout-chart/scripts/workout_chart.py \
  --env .env \
  --output workout_chart.png
```

| Flag | Default | Description |
|------|---------|-------------|
| `--env` | `.env` | Path to the .env file containing `DATABASE_URL` |
| `--output` | `workout_chart.png` | Output image file path |

## Workflow

1. Run the script with the Bash tool from the project root
2. Tell the user where the image was saved and what it shows (total workouts, months covered)
3. If the user wants a different output path, adjust `--output` accordingly
