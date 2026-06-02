from dataclasses import dataclass, field
from typing import List, Tuple
import math

@dataclass
class DaySegment:
    """Represents one day's duty activity"""
    day_number: int
    start_of_day_cycle_used: float   # hours at start of this day
    driving_start: str               # "06:00" HH:MM
    activities: List[dict]           # ordered list of activities
    total_driving: float
    total_on_duty: float
    is_compliant: bool
    violations: List[str]

class HOSCalculator:
    MAX_DRIVE_DAILY    = 11.0   # hours
    MAX_ON_DUTY_WINDOW = 14.0   # hours (from first on-duty moment)
    MAX_CYCLE          = 70.0   # hours in 8 days
    BREAK_REQUIRED_AFTER = 8.0  # hours of driving before mandatory break
    BREAK_DURATION       = 0.5  # hours (30 min)
    PICKUP_DROPOFF_TIME  = 1.0  # hour each (on-duty, not driving)
    FUEL_STOP_TIME       = 0.5  # hours (30 min)
    FUEL_STOP_INTERVAL   = 1000 # miles

    def __init__(self, current_cycle_used: float):
        self.cycle_used = current_cycle_used

    def plan_trip(
        self,
        total_distance_miles: float,
        total_drive_hours: float,
        fuel_stops: int,
        start_time: str = "08:00"
    ) -> dict:
        """
        Break a trip into days with full activity schedules.
        Returns a list of DaySegment objects + compliance summary.
        """

        remaining_drive   = total_drive_hours
        remaining_cycle   = self.MAX_CYCLE - self.cycle_used
        current_hour      = self._parse_time(start_time)
        day               = 1
        days              = []
        violations        = []
        has_pickup        = True
        has_dropoff       = True
        fuel_stops_done   = 0
        miles_since_fuel  = 0
        driving_since_break = 0.0

        # Total on-duty time includes driving + pickup + dropoff + fuel stops
        total_fuel_stops  = math.ceil(total_distance_miles / self.FUEL_STOP_INTERVAL) - 1
        total_fuel_stops  = max(0, total_fuel_stops)

        while remaining_drive > 0 or has_pickup or has_dropoff:
            day_activities  = []
            day_on_duty     = 0.0
            day_driving     = 0.0
            window_start    = current_hour  # 14-hr window starts here
            day_violations  = []
            driving_since_break = 0.0  # resets each day (or after break)

            # -- Pickup on day 1 --
            if has_pickup and day == 1:
                act = self._add_activity("on_duty_not_driving", "Pickup", 
                                          current_hour, self.PICKUP_DROPOFF_TIME)
                day_activities.append(act)
                current_hour  += self.PICKUP_DROPOFF_TIME
                day_on_duty   += self.PICKUP_DROPOFF_TIME
                has_pickup     = False

            # -- Drive as much as allowed today --
            available_drive_today = min(
                self.MAX_DRIVE_DAILY - day_driving,
                self.MAX_ON_DUTY_WINDOW - (current_hour - window_start),
                remaining_cycle,
                remaining_drive
            )

            while available_drive_today > 0:
                # Check if fuel stop needed (every 1000 miles, ~10 hrs at 55mph avg)
                miles_this_segment = available_drive_today * 55
                if miles_since_fuel + miles_this_segment >= self.FUEL_STOP_INTERVAL:
                    hours_to_fuel = (self.FUEL_STOP_INTERVAL - miles_since_fuel) / 55
                    # Drive to fuel stop
                    if hours_to_fuel > 0:
                        # Check mandatory break first
                        if driving_since_break + hours_to_fuel > self.BREAK_REQUIRED_AFTER:
                            break_before = self.BREAK_REQUIRED_AFTER - driving_since_break
                            if break_before > 0:
                                act = self._add_activity("driving", "Driving",
                                                          current_hour, break_before)
                                day_activities.append(act)
                                current_hour       += break_before
                                day_driving        += break_before
                                day_on_duty        += break_before
                                available_drive_today -= break_before
                                remaining_drive    -= break_before
                                driving_since_break += break_before
                                self.cycle_used    += break_before
                                remaining_cycle    -= break_before
                            # Mandatory break
                            act = self._add_activity("off_duty", "30-min Rest Break",
                                                      current_hour, self.BREAK_DURATION)
                            day_activities.append(act)
                            current_hour          += self.BREAK_DURATION
                            driving_since_break    = 0.0
                        else:
                            act = self._add_activity("driving", "Driving to Fuel Stop",
                                                      current_hour, hours_to_fuel)
                            day_activities.append(act)
                            current_hour       += hours_to_fuel
                            day_driving        += hours_to_fuel
                            day_on_duty        += hours_to_fuel
                            available_drive_today -= hours_to_fuel
                            remaining_drive    -= hours_to_fuel
                            driving_since_break += hours_to_fuel
                            self.cycle_used    += hours_to_fuel
                            remaining_cycle    -= hours_to_fuel

                    # Fuel stop
                    act = self._add_activity("on_duty_not_driving", "Fuel Stop",
                                              current_hour, self.FUEL_STOP_TIME)
                    day_activities.append(act)
                    current_hour      += self.FUEL_STOP_TIME
                    day_on_duty       += self.FUEL_STOP_TIME
                    miles_since_fuel   = 0
                    fuel_stops_done   += 1
                    available_drive_today -= self.FUEL_STOP_TIME
                    continue

                # Normal driving block
                drive_block = min(available_drive_today, 
                                  self.BREAK_REQUIRED_AFTER - driving_since_break)
                if drive_block <= 0:
                    # Need a mandatory break
                    act = self._add_activity("off_duty", "30-min Mandatory Break",
                                              current_hour, self.BREAK_DURATION)
                    day_activities.append(act)
                    current_hour += self.BREAK_DURATION
                    driving_since_break = 0.0
                    available_drive_today -= self.BREAK_DURATION
                    continue

                act = self._add_activity("driving", "Driving",
                                          current_hour, drive_block)
                day_activities.append(act)
                current_hour          += drive_block
                day_driving           += drive_block
                day_on_duty           += drive_block
                available_drive_today  -= drive_block
                remaining_drive       -= drive_block
                driving_since_break   += drive_block
                self.cycle_used       += drive_block
                remaining_cycle       -= drive_block
                miles_since_fuel      += drive_block * 55

                available_drive_today = min(
                    self.MAX_DRIVE_DAILY - day_driving,
                    self.MAX_ON_DUTY_WINDOW - (current_hour - window_start),
                    self.MAX_CYCLE - self.cycle_used,
                    remaining_drive
                )

            # Dropoff on final driving day
            if remaining_drive <= 0 and has_dropoff:
                act = self._add_activity("on_duty_not_driving", "Dropoff",
                                          current_hour, self.PICKUP_DROPOFF_TIME)
                day_activities.append(act)
                current_hour  += self.PICKUP_DROPOFF_TIME
                day_on_duty   += self.PICKUP_DROPOFF_TIME
                has_dropoff    = False

            # Off duty for rest of day
            end_of_day = 24.0
            if current_hour < end_of_day:
                act = self._add_activity("off_duty", "Off Duty / Rest",
                                          current_hour, end_of_day - current_hour)
                day_activities.append(act)

            # Validate this day
            if day_driving > self.MAX_DRIVE_DAILY:
                day_violations.append(f"Day {day}: Exceeds 11-hour drive limit ({day_driving:.1f}h)")
            if day_on_duty > self.MAX_ON_DUTY_WINDOW:
                day_violations.append(f"Day {day}: Exceeds 14-hour on-duty window")
            if self.cycle_used > self.MAX_CYCLE:
                day_violations.append(f"Day {day}: Exceeds 70-hour/8-day cycle limit")

            violations.extend(day_violations)

            days.append({
                "day": day,
                "activities": day_activities,
                "total_driving_hours": round(day_driving, 2),
                "total_on_duty_hours": round(day_on_duty, 2),
                "is_compliant": len(day_violations) == 0,
                "violations": day_violations,
            })

            # Reset for next day (10-hour mandatory rest)
            current_hour = 0.0  # midnight start
            day += 1

            if day > 14:  # safety valve
                break

        return {
            "days": days,
            "total_days": len(days),
            "is_compliant": len(violations) == 0,
            "violations": violations,
            "remaining_cycle_hours": round(self.MAX_CYCLE - self.cycle_used, 2),
            "cycle_used_after_trip": round(self.cycle_used, 2),
        }

    def _parse_time(self, time_str: str) -> float:
        """'08:30' → 8.5"""
        h, m = map(int, time_str.split(':'))
        return h + m / 60.0

    def _add_activity(self, status: str, label: str, 
                       start_hour: float, duration: float) -> dict:
        return {
            "status": status,      # "driving" | "on_duty_not_driving" | "off_duty" | "sleeper_berth"
            "label": label,
            "start": round(start_hour, 4),
            "end": round(start_hour + duration, 4),
            "duration": round(duration, 4),
            "start_str": self._format_time(start_hour),
            "end_str": self._format_time(start_hour + duration),
        }

    def _format_time(self, hours: float) -> str:
        """8.5 → '08:30'"""
        h = int(hours) % 24
        m = int((hours % 1) * 60)
        return f"{h:02d}:{m:02d}"
