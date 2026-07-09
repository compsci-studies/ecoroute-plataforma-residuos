"""
Synthetic waste data generator for EcoRoute in the Grande São Paulo context.

The generated dataset is demonstrative: it creates plausible daily waste
volumes by area type, weekday, rainy season and Brazilian holidays.
"""

from datetime import date, timedelta

import numpy as np
import pandas as pd

from brazil_holidays import (
    days_to_nearest_holiday,
    get_holiday_impact_multiplier,
    get_holiday_info,
)


np.random.seed(42)


DISTRICTS = {
    "Centro": {"type": "commercial", "base_waste_kg": 4300, "weekend_effect": -0.12, "rain_effect": -0.08},
    "Bela Vista": {"type": "commercial", "base_waste_kg": 3800, "weekend_effect": -0.08, "rain_effect": -0.07},
    "Pinheiros": {"type": "commercial", "base_waste_kg": 3600, "weekend_effect": -0.05, "rain_effect": -0.06},
    "Brás": {"type": "commercial", "base_waste_kg": 4100, "weekend_effect": -0.18, "rain_effect": -0.05},
    "Liberdade": {"type": "commercial", "base_waste_kg": 2900, "weekend_effect": 0.08, "rain_effect": -0.06},
    "Vila Mariana": {"type": "residential", "base_waste_kg": 2500, "weekend_effect": 0.14, "rain_effect": -0.04},
    "Mooca": {"type": "residential", "base_waste_kg": 2300, "weekend_effect": 0.15, "rain_effect": -0.04},
    "Tatuapé": {"type": "residential", "base_waste_kg": 2600, "weekend_effect": 0.13, "rain_effect": -0.03},
    "Santana": {"type": "residential", "base_waste_kg": 2100, "weekend_effect": 0.12, "rain_effect": -0.05},
    "Lapa": {"type": "residential", "base_waste_kg": 2200, "weekend_effect": 0.12, "rain_effect": -0.04},
    "Butantã": {"type": "suburban", "base_waste_kg": 1900, "weekend_effect": 0.10, "rain_effect": -0.05},
    "Vila Madalena": {"type": "commercial", "base_waste_kg": 3000, "weekend_effect": 0.20, "rain_effect": -0.08},
    "Santo Amaro": {"type": "commercial", "base_waste_kg": 3400, "weekend_effect": -0.07, "rain_effect": -0.05},
    "Itaquera": {"type": "residential", "base_waste_kg": 2800, "weekend_effect": 0.13, "rain_effect": -0.04},
    "São Mateus": {"type": "suburban", "base_waste_kg": 1800, "weekend_effect": 0.11, "rain_effect": -0.05},
    "Parelheiros": {"type": "rural", "base_waste_kg": 850, "weekend_effect": 0.08, "rain_effect": -0.10},
    "Osasco Centro": {"type": "commercial", "base_waste_kg": 3200, "weekend_effect": -0.05, "rain_effect": -0.05},
    "Guarulhos Centro": {"type": "commercial", "base_waste_kg": 3500, "weekend_effect": -0.04, "rain_effect": -0.04},
    "Santo André": {"type": "residential", "base_waste_kg": 2700, "weekend_effect": 0.10, "rain_effect": -0.04},
    "São Bernardo": {"type": "industrial", "base_waste_kg": 3900, "weekend_effect": -0.20, "rain_effect": -0.03},
}


def get_season(month):
    if month in [12, 1, 2]:
        return "verao_chuvoso"
    if month in [3, 4, 5]:
        return "outono"
    if month in [6, 7, 8]:
        return "inverno_seco"
    return "primavera"


def is_rainy_season(month):
    return month in [12, 1, 2, 3]


def season_multiplier(month):
    multipliers = {
        1: 1.12,
        2: 1.10,
        3: 1.04,
        4: 1.00,
        5: 0.98,
        6: 0.95,
        7: 0.94,
        8: 0.96,
        9: 1.00,
        10: 1.04,
        11: 1.10,
        12: 1.18,
    }
    return multipliers.get(month, 1.0)


def generate_dataset(start_date=date(2024, 1, 1), end_date=date(2025, 12, 31)):
    records = []
    current = start_date

    while current <= end_date:
        day_of_week = current.weekday()
        month = current.month
        is_weekend = 1 if day_of_week >= 5 else 0
        season = get_season(month)
        holiday_name, _ = get_holiday_info(current)
        is_holiday = 1 if holiday_name else 0
        holiday_multiplier = get_holiday_impact_multiplier(current)
        holiday_proximity = days_to_nearest_holiday(current)

        for district_name, config in DISTRICTS.items():
            waste = config["base_waste_kg"] * season_multiplier(month)

            if is_rainy_season(month):
                waste *= 1 + config["rain_effect"]

            if is_weekend:
                waste *= 1 + config["weekend_effect"]

            if day_of_week == 4:
                waste *= 1.07
            elif day_of_week == 0:
                waste *= 0.96

            waste *= holiday_multiplier
            noise = max(0.72, min(1.32, np.random.normal(1.0, 0.12)))
            waste = max(0, round(waste * noise, 1))

            records.append({
                "district": district_name,
                "date": current.isoformat(),
                "day_of_week": day_of_week,
                "month": month,
                "is_weekend": is_weekend,
                "is_holiday": is_holiday,
                "holiday_name": holiday_name or "",
                "holiday_proximity": holiday_proximity,
                "season": season,
                "district_type": config["type"],
                "waste_kg": waste,
            })

        current += timedelta(days=1)

    return pd.DataFrame(records)


def save_dataset(output_path="./data/sao_paulo_waste_data.csv"):
    print("Generating synthetic waste data for Grande São Paulo...")
    df = generate_dataset()
    print(f"  Total records: {len(df)}")
    print(f"  Date range: {df['date'].min()} to {df['date'].max()}")
    print(f"  Districts: {df['district'].nunique()}")
    print("\n  Waste stats by district type:")
    print(df.groupby("district_type")["waste_kg"].describe().round(1).to_string())
    df.to_csv(output_path, index=False)
    print(f"\n  Saved to {output_path}")
    return df


if __name__ == "__main__":
    save_dataset()
