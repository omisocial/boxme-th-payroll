-- 013: Add employee_code and national_id to workers
-- employee_code = Boxme HRMS employee number (e.g. BKK-1234)
-- national_id   = Citizen ID / CCCD / Passport (secondary dedup identifier)

ALTER TABLE workers ADD COLUMN IF NOT EXISTS employee_code TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS national_id   TEXT;

-- Optional: index for faster matching in resolve endpoint
CREATE INDEX IF NOT EXISTS idx_workers_employee_code ON workers(employee_code) WHERE employee_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_workers_national_id   ON workers(national_id)   WHERE national_id IS NOT NULL;
