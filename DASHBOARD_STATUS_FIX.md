# Dashboard Active Shipments Fix

## مشکل (Problem)

داشبورد عدد صفر برای "Active Shipments" نشان می‌داد، حتی زمانی که shipment های جدید ایجاد شده بودند.

The dashboard was showing zero for "Active Shipments" even when new shipments were created.

## علت ریشه‌ای (Root Cause)

1. **Case Sensitivity**: کد داشبورد به دنبال status های با حروف کوچک می‌گشت (`'active'`, `'posted'`)، اما دیتابیس status ها را با حروف بزرگ ذخیره می‌کند (`'ACTIVE'`, `'POSTED'`)

2. **Missing Status**: داشبورد فقط shipment های با status `'active'` را می‌شمرد، اما shipment های جدید با status `'POSTED'` ایجاد می‌شوند

## راه حل (Solution)

تمام فیلترهای status در `ShipperDashboard.jsx` را به case-insensitive تبدیل کردیم و `'POSTED'` را به لیست active shipments اضافه کردیم.

Made all status filters case-insensitive and included `'POSTED'` status in active shipments count.

## تغییرات کد (Code Changes)

### `src/components/ShipperDashboard.jsx`

#### 1. Shipment Stats (Lines 68-72)
```javascript
// قبل (Before)
const shipmentStats = {
  draft: shipments.filter(s => s.status === 'draft').length,
  activeBidding: shipments.filter(s => s.status === 'active').length,
  inProgress: shipments.filter(s => s.status === 'accepted').length,
  completed: shipments.filter(s => s.status === 'completed').length,
  cancelled: shipments.filter(s => s.status === 'cancelled').length
}

// بعد (After)
const shipmentStats = {
  draft: shipments.filter(s => s.status?.toLowerCase() === 'draft').length,
  activeBidding: shipments.filter(s => ['active', 'posted'].includes(s.status?.toLowerCase())).length,
  inProgress: shipments.filter(s => s.status?.toLowerCase() === 'accepted').length,
  completed: shipments.filter(s => s.status?.toLowerCase() === 'completed').length,
  cancelled: shipments.filter(s => s.status?.toLowerCase() === 'cancelled').length
}
```

**تغییرات کلیدی:**
- اضافه شدن `?.toLowerCase()` برای case-insensitive comparison
- `activeBidding` حالا شامل هر دو `'active'` و `'posted'` می‌شود
- استفاده از optional chaining (`?.`) برای جلوگیری از خطا

#### 2. Pending Payments (Line 76)
```javascript
// قبل
const pendingPayments = payments.filter(p => 
  p.status === 'pending' || p.status === 'authorized'
).length

// بعد
const pendingPayments = payments.filter(p => 
  ['pending', 'authorized'].includes(p.status?.toLowerCase())
).length
```

#### 3. Monthly Payments (Lines 85, 88)
```javascript
// قبل
const thisMonthPayments = payments.filter(p => 
  p.status === 'completed' && new Date(p.created_at) >= thisMonth
)
const lastMonthPayments = payments.filter(p => 
  p.status === 'completed' && ...
)

// بعد
const thisMonthPayments = payments.filter(p => 
  p.status?.toLowerCase() === 'completed' && new Date(p.created_at) >= thisMonth
)
const lastMonthPayments = payments.filter(p => 
  p.status?.toLowerCase() === 'completed' && ...
)
```

#### 4. Pending Total (Line 96)
```javascript
// قبل
const pendingTotal = payments
  .filter(p => p.status === 'pending')
  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)

// بعد
const pendingTotal = payments
  .filter(p => p.status?.toLowerCase() === 'pending')
  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
```

#### 5. Completed Shipments & Payments (Lines 99, 101)
```javascript
// قبل
const completedShipments = shipments.filter(s => s.status === 'completed')
const totalSpent = payments
  .filter(p => p.status === 'completed')

// بعد
const completedShipments = shipments.filter(s => s.status?.toLowerCase() === 'completed')
const totalSpent = payments
  .filter(p => p.status?.toLowerCase() === 'completed')
```

## Status Values در سیستم

### Shipment Statuses
- `POSTED` - تازه ایجاد شده، منتظر bid ها
- `ACTIVE` - در حال دریافت bid
- `ACCEPTED` - bid پذیرفته شده، در حال انجام
- `COMPLETED` - تکمیل شده
- `CANCELLED` - لغو شده
- `DRAFT` - پیش‌نویس

### Payment Statuses
- `PENDING` - در انتظار پرداخت
- `AUTHORIZED` - تایید شده
- `COMPLETED` - پرداخت شده

### Bid Statuses
- `SUBMITTED` - ارسال شده
- `ACCEPTED` - پذیرفته شده
- `REJECTED` - رد شده

## نتیجه (Result)

✅ **Active Shipments** حالا به درستی shipment های با status `POSTED` و `ACTIVE` را نشان می‌دهد

✅ تمام فیلترهای status حالا case-insensitive هستند

✅ از optional chaining برای جلوگیری از خطاهای null/undefined استفاده شده

## فرمول محاسبه Active Shipments

```javascript
activeShipments = activeBidding + inProgress
```

که در آن:
- `activeBidding` = shipments با status `POSTED` یا `ACTIVE`
- `inProgress` = shipments با status `ACCEPTED`

## تست (Testing)

برای تست:
1. یک shipment جدید ایجاد کنید
2. به داشبورد بروید
3. عدد "Active Shipments" باید افزایش یابد
4. در بخش "Shipment Stats" باید در "Active Bidding" نمایش داده شود

## یادداشت‌های فنی

- همه status ها در دیتابیس با حروف بزرگ ذخیره می‌شوند
- استفاده از `toLowerCase()` برای مقایسه case-insensitive
- استفاده از `?.` برای جلوگیری از خطا در صورت null/undefined بودن status
- استفاده از `includes()` برای چک کردن چند status به جای OR های متعدد
