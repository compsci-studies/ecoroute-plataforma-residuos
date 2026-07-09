"""
Brazilian holidays and civic dates used by the EcoRoute scheduling model.

The dates are enough for the academic demonstration and represent common
periods that affect urban waste volume in São Paulo: long weekends, carnival,
 Christmas/New Year, retail peaks and city events.
"""

from datetime import date, timedelta


BRAZIL_HOLIDAYS = [
    # 2024
    (date(2024, 1, 1), "Ano Novo", "major"),
    (date(2024, 1, 25), "Aniversário de São Paulo", "moderate"),
    (date(2024, 2, 12), "Carnaval", "major"),
    (date(2024, 2, 13), "Carnaval", "major"),
    (date(2024, 3, 29), "Sexta-feira Santa", "moderate"),
    (date(2024, 4, 21), "Tiradentes", "minor"),
    (date(2024, 5, 1), "Dia do Trabalho", "moderate"),
    (date(2024, 5, 30), "Corpus Christi", "moderate"),
    (date(2024, 7, 9), "Revolução Constitucionalista", "minor"),
    (date(2024, 9, 7), "Independência do Brasil", "minor"),
    (date(2024, 10, 12), "Nossa Senhora Aparecida", "moderate"),
    (date(2024, 11, 2), "Finados", "minor"),
    (date(2024, 11, 15), "Proclamação da República", "minor"),
    (date(2024, 11, 20), "Consciência Negra", "minor"),
    (date(2024, 12, 24), "Véspera de Natal", "major"),
    (date(2024, 12, 25), "Natal", "major"),
    (date(2024, 12, 31), "Réveillon", "major"),
    # 2025
    (date(2025, 1, 1), "Ano Novo", "major"),
    (date(2025, 1, 25), "Aniversário de São Paulo", "moderate"),
    (date(2025, 3, 3), "Carnaval", "major"),
    (date(2025, 3, 4), "Carnaval", "major"),
    (date(2025, 4, 18), "Sexta-feira Santa", "moderate"),
    (date(2025, 4, 21), "Tiradentes", "minor"),
    (date(2025, 5, 1), "Dia do Trabalho", "moderate"),
    (date(2025, 6, 19), "Corpus Christi", "moderate"),
    (date(2025, 7, 9), "Revolução Constitucionalista", "minor"),
    (date(2025, 9, 7), "Independência do Brasil", "minor"),
    (date(2025, 10, 12), "Nossa Senhora Aparecida", "moderate"),
    (date(2025, 11, 2), "Finados", "minor"),
    (date(2025, 11, 15), "Proclamação da República", "minor"),
    (date(2025, 11, 20), "Consciência Negra", "minor"),
    (date(2025, 12, 24), "Véspera de Natal", "major"),
    (date(2025, 12, 25), "Natal", "major"),
    (date(2025, 12, 31), "Réveillon", "major"),
    # 2026
    (date(2026, 1, 1), "Ano Novo", "major"),
    (date(2026, 1, 25), "Aniversário de São Paulo", "moderate"),
    (date(2026, 2, 16), "Carnaval", "major"),
    (date(2026, 2, 17), "Carnaval", "major"),
    (date(2026, 4, 3), "Sexta-feira Santa", "moderate"),
    (date(2026, 4, 21), "Tiradentes", "minor"),
    (date(2026, 5, 1), "Dia do Trabalho", "moderate"),
    (date(2026, 6, 4), "Corpus Christi", "moderate"),
    (date(2026, 7, 9), "Revolução Constitucionalista", "minor"),
    (date(2026, 9, 7), "Independência do Brasil", "minor"),
    (date(2026, 10, 12), "Nossa Senhora Aparecida", "moderate"),
    (date(2026, 11, 2), "Finados", "minor"),
    (date(2026, 11, 15), "Proclamação da República", "minor"),
    (date(2026, 11, 20), "Consciência Negra", "minor"),
    (date(2026, 12, 24), "Véspera de Natal", "major"),
    (date(2026, 12, 25), "Natal", "major"),
    (date(2026, 12, 31), "Réveillon", "major"),
]


def get_holiday_dates():
    return {item[0] for item in BRAZIL_HOLIDAYS}


def get_holiday_info(target_date):
    for holiday_date, name, impact in BRAZIL_HOLIDAYS:
        if holiday_date == target_date:
            return name, impact
    return None, None


def get_holiday_impact_multiplier(target_date):
    _, impact = get_holiday_info(target_date)
    if impact == "major":
        return 1.65
    if impact == "moderate":
        return 1.35
    if impact == "minor":
        return 1.15

    for delta in [1, 2]:
        for nearby in [target_date - timedelta(days=delta), target_date + timedelta(days=delta)]:
            _, nearby_impact = get_holiday_info(nearby)
            if nearby_impact == "major":
                return 1.30
            if nearby_impact == "moderate":
                return 1.15

    return 1.0


def days_to_nearest_holiday(target_date):
    return min(abs((holiday_date - target_date).days) for holiday_date in get_holiday_dates())
