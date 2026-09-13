-- Menu schedules are covered by pre-order. Remove the schedules feature.

DROP INDEX IF EXISTS schedules_date_idx;
DROP TABLE IF EXISTS schedules;
