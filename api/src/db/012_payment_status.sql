-- Phase 2: payment status tracking for payroll lines
-- Adds per-line payment status independent of the period lifecycle (open/locked/approved/exported).
-- A line can be marked "paid" by HR after the bank transfer is confirmed.

ALTER TABLE payroll_period_lines
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid'));

ALTER TABLE payroll_period_lines
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE payroll_period_lines
  ADD COLUMN IF NOT EXISTS paid_by TEXT;

ALTER TABLE payroll_period_lines
  ADD COLUMN IF NOT EXISTS payment_note TEXT;

CREATE INDEX IF NOT EXISTS idx_ppl_payment_status
  ON payroll_period_lines(period_id, payment_status);
