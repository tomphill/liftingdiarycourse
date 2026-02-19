#!/usr/bin/env python3
"""
Query the workouts table for the past year and export a monthly bar chart as an image.

Usage:
    python3 workout_chart.py [--env /path/to/.env] [--output workout_chart.png]
"""

import argparse
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path


def load_env(env_path: str) -> str:
    """Parse DATABASE_URL from a .env file."""
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise ValueError("DATABASE_URL not found in .env file")


def query_workouts(database_url: str) -> list[tuple[str, int]]:
    """Return list of (month_label, count) for the past 12 months."""
    try:
        import psycopg2
    except ImportError:
        print("psycopg2 not found. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2

    now = datetime.now()
    one_year_ago = now - timedelta(days=365)

    sql = """
        SELECT
            TO_CHAR(DATE_TRUNC('month', started_at), 'Mon YYYY') AS month_label,
            DATE_TRUNC('month', started_at) AS month_start,
            COUNT(*) AS workout_count
        FROM workouts
        WHERE started_at >= %s
        GROUP BY month_start, month_label
        ORDER BY month_start;
    """

    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, (one_year_ago,))
            rows = cur.fetchall()
    finally:
        conn.close()

    return [(row[0], int(row[2])) for row in rows]


def plot_chart(data: list[tuple[str, int]], output_path: str) -> None:
    """Render a bar chart and save it as an image."""
    try:
        import matplotlib.pyplot as plt
        import matplotlib
        matplotlib.use("Agg")  # non-interactive backend
    except ImportError:
        print("matplotlib not found. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "matplotlib"])
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt

    if not data:
        print("No workout data found for the past year.")
        return

    labels = [row[0] for row in data]
    counts = [row[1] for row in data]

    fig, ax = plt.subplots(figsize=(12, 6))
    bars = ax.bar(labels, counts, color="#4F46E5", edgecolor="white", linewidth=0.5)

    # Value labels above bars
    for bar, count in zip(bars, counts):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.1,
            str(count),
            ha="center",
            va="bottom",
            fontsize=10,
            fontweight="bold",
            color="#1F2937",
        )

    ax.set_xlabel("Month", fontsize=12, labelpad=10)
    ax.set_ylabel("Number of Workouts", fontsize=12, labelpad=10)
    ax.set_title("Workouts per Month (Past Year)", fontsize=16, fontweight="bold", pad=20)
    ax.set_ylim(0, max(counts) * 1.2 if counts else 1)
    ax.yaxis.set_major_locator(plt.MaxNLocator(integer=True))
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()

    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    print(f"Chart saved to: {output_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate a workout bar chart from the database.")
    parser.add_argument(
        "--env",
        default=".env",
        help="Path to the .env file (default: .env in current directory)",
    )
    parser.add_argument(
        "--output",
        default="workout_chart.png",
        help="Output image path (default: workout_chart.png)",
    )
    args = parser.parse_args()

    env_path = Path(args.env)
    if not env_path.exists():
        print(f"Error: .env file not found at '{env_path}'")
        sys.exit(1)

    print(f"Loading DATABASE_URL from {env_path}...")
    database_url = load_env(str(env_path))

    print("Querying workouts for the past year...")
    data = query_workouts(database_url)
    print(f"Found {sum(c for _, c in data)} workouts across {len(data)} month(s).")

    plot_chart(data, args.output)


if __name__ == "__main__":
    main()
