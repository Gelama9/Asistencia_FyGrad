import { pgTable, text, serial, integer, decimal, timestamp, primaryKey, unique } from 'drizzle-orm/pg-core';

export const devices = pgTable('devices', {
  deviceId: text('device_id').primaryKey(),
  displayName: text('display_name'),
  salaryPerBlock: decimal('salary_per_block', { precision: 10, scale: 2 }).default('46.00'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  deviceId: text('device_id'), // used for relations or device identification
  action: text('action').notNull(), // 'ENTRADA' | 'SALIDA'
  bssid: text('bssid'),
  timestamp: timestamp('timestamp').notNull(),
});

export const attendanceOverrides = pgTable('attendance_overrides', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  dateKey: text('date_key').notNull(),
  blockType: text('block_type').notNull(), // 'morning' | 'afternoon'
  status: text('status'),
  notes: text('notes'),
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }).default('0.00'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  userDateBlockUnique: unique().on(table.userId, table.dateKey, table.blockType),
}));

export const lateFeeRules = pgTable('late_fee_rules', {
  id: serial('id').primaryKey(),
  blockType: text('block_type').notNull(), // 'morning' | 'afternoon'
  minMinutes: integer('min_minutes').notNull(),
  maxMinutes: integer('max_minutes'),
  feeAmount: decimal('fee_amount', { precision: 10, scale: 2 }).notNull(),
});

export const employeeMonthlySummaries = pgTable('employee_monthly_summaries', {
  userId: text('user_id').notNull(),
  monthKey: text('month_key').notNull(), // 'YYYY-MM'
  advanceAmount: decimal('advance_amount', { precision: 10, scale: 2 }).default('0.00'),
  regularizeAmount: decimal('regularize_amount', { precision: 10, scale: 2 }).default('0.00'),
  notes: text('notes'),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.monthKey] }),
}));

export const schedules = pgTable('schedules', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(),
  dayOfWeek: integer('day_of_week').notNull(), // 0 (Sun) to 6 (Sat)
  blockType: text('block_type').notNull(), // 'morning' | 'afternoon'
}, (table) => ({
  userDayBlockUnique: unique().on(table.userId, table.dayOfWeek, table.blockType),
}));
