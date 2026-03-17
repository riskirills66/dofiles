---
name: otomax-db
description: Otomax database operations - reseller management, transactions, and SQL queries
license: MIT
compatibility: opencode
---

# Otomax Database Operations Skill

## Database Info
- **DB**: `otomax` - Pulsa/prepaid distribution system
- **Records**: 44K resellers, 5.2M transactions, 11K products

## Natural Language Commands
| User Says | SQL |
|-----------|-----|
| "update APPS0119 to C" | `UPDATE reseller SET kode_level = 'C' WHERE kode = 'APPS0119'` |
| "check APPS0119" | `SELECT * FROM reseller WHERE kode = 'APPS0119'` |
| "list level A" | `SELECT * FROM reseller WHERE kode_level = 'A' AND aktif = 1` |
| "token products" | `SELECT kode FROM produk WHERE catatan LIKE '%TOKEN%' AND aktif = 1` |
| "pulsa products" | `SELECT kode FROM produk WHERE catatan LIKE '%REGULER%' AND aktif = 1` |
| "export inactive members" | `SELECT r.kode, r.saldo, COALESCE(p.pengirim, r.nomor_hp) AS NOHP, r.kode_upline, r.tgl_daftar, r.tgl_aktivitas, r.alamat FROM reseller r LEFT JOIN pengirim p ON r.kode = p.kode_reseller WHERE r.tgl_aktivitas <= DATEADD(day, -7, GETDATE())` |

## Core Tables

### reseller (44K rows)
**Columns**: kode(PK), nama, kode_level, saldo, aktif, kode_upline, tgl_daftar, tgl_aktivitas, nomor_hp, email, suspend, deleted
**Levels**: A, B, C, D, H, M, O, Q, S, X, Y, CK, PRIO, PRIOALT
**Operations**: UPDATE level only (no add/delete)

### transaksi (5.2M rows)
**Columns**: kode(PK), tgl_entri, kode_produk, tujuan, kode_reseller, harga, harga_beli, status, tgl_status, sn, komisi, poin

**Status Codes**:
- **0-5**: Processing (0=not processed, 1=processing, 2=waiting, 5=scheduled)
- **20-23**: Success (20=success, 21-23=success variants)
- **40-72**: Failed (40=failed, 43=insufficient balance, 46=duplicate, 47=disruption, 49=wrong PIN, 51=inactive reseller, 55=timeout, 63=suspended)

### mutasi (4.3M rows)
**Columns**: kode(PK), kode_reseller, tanggal, jumlah, keterangan, jenis, kode_transaksi, saldo_akhir
**Types**: T=transaction, D=deposit

### produk (11K rows)
**Columns**: kode(PK), nama, harga_jual, harga_beli, stok, aktif, gangguan, kode_operator, catatan, nominal
**Categories** (via catatan): TOKEN, REGULER, DATA, GAME, EMONEY, PLN, GAS, TV, BPJS

**Product Types**:
- **Regular/Common Products**: Normal pricing (harga_jual > harga_beli), standard speed
- **Promo Products**: Cheaper pricing (often harga_jual ≤ harga_beli), slower speed (1-5 minutes)

**Promo Product Indicators**:
1. **Price**: `harga_jual < harga_beli` OR `harga_beli = 0` (subsidized/promo)
2. **Name Keywords**: Contains "lambat", "slow", "sabar", "berpotensi lambat", "murah", "promo", "1-5 mnt"
3. **Operators**: PMP (Isi Token Murah), PML (Isi Token slow), operators with "MURAH" suffix

**Examples**:
- Promo: TOKENP20 "Speed Bisa Cepat/Lambat 1-5 mnt (Recomendasi Sabar + Harga Murah)" - Rp 20,950
- Regular: P20 "Token Retail + Full Detikan + Super Poin" - Rp 21,765
- Promo: BCAMURAH "10.000 sd 250.000 (Berpotensi Lambat!)" - Rp 450
- Promo: DNF10 "Dana B2B, Speed Berpotensi Lambat.." - Rp 10,075

### operator (1.4K rows)
**Columns**: kode(PK), nama, catatan, prefix_tujuan, gangguan
**Token Operators**: P(fast retail), PM(fast main), PMP(slow/promo), PML(slow), PERTAGAS(gas)
**Pulsa Operators**: AX/AXL/AXR(Axis), 0ISAT/1IR/3IL(Indosat), 0TRI/1TR/2TL(Three), ATSELS(Telkomsel)

### level (20 rows)
**Columns**: kode(PK), nama, selisih_harga, kode_upline, deposit_minimal, deposit_maksimal

### pengirim
**Columns**: pengirim(PK), tipe_pengirim, kode_reseller, kirim_info, tgl_data, akses, wrkirim, wrgkirim
**Purpose**: Stores phone numbers used by resellers for transactions
**Phone Number Types** (tipe_pengirim):
- **S**: SMS-based phone numbers (priority/primary)
- **W**: WhatsApp-based phone numbers (secondary)
**Note**: A reseller can have multiple phone numbers registered with different types

## Financial Metrics
- **Amount/Revenue**: `SUM(harga)` - what customers paid
- **Profit/Margin**: `SUM(harga - ISNULL(harga_beli, 0))` - actual profit
- **Cost**: `SUM(harga_beli)` - what we paid suppliers

## Fast Queries

### Reseller Operations
```sql
-- Update level
UPDATE reseller SET kode_level = 'C' WHERE kode = 'APPS0119'

-- Check details
SELECT kode, nama, kode_level, saldo, aktif FROM reseller WHERE kode = 'APPS0119'

-- Recent transactions
SELECT TOP 20 kode, tgl_entri, kode_produk, tujuan, harga, status FROM transaksi WHERE kode_reseller = 'APPS0119' ORDER BY tgl_entri DESC

-- Balance history
SELECT TOP 20 tanggal, jumlah, keterangan, saldo_akhir FROM mutasi WHERE kode_reseller = 'APPS0119' ORDER BY tanggal DESC

-- Export member data to CSV (inactive members)
SELECT 
    r.kode AS NAMAMEMBER,
    r.saldo AS SALDO,
    COALESCE(p.pengirim, r.nomor_hp) AS NOHP,
    r.kode_upline AS UPLINE,
    CONVERT(VARCHAR, r.tgl_daftar, 120) AS TGLDAFTAR,
    CONVERT(VARCHAR, r.tgl_aktivitas, 120) AS LASTAKTIF,
    REPLACE(REPLACE(r.alamat, ',', ';'), CHAR(13) + CHAR(10), ' ') AS ALAMAT
FROM reseller r
LEFT JOIN pengirim p ON r.kode = p.kode_reseller
WHERE r.tgl_aktivitas < DATEADD(day, -7, GETDATE())
ORDER BY r.tgl_aktivitas DESC
```

### Product Queries
```sql
-- Token products
SELECT kode, nama, harga_jual FROM produk WHERE catatan LIKE '%TOKEN%' AND aktif = 1

-- Pulsa products
SELECT kode, nama, harga_jual FROM produk WHERE catatan LIKE '%REGULER%' AND aktif = 1

-- By operator
SELECT kode, nama FROM produk WHERE kode_operator = 'PMP' AND aktif = 1

-- Promo products (by price)
SELECT kode, nama, harga_jual, harga_beli FROM produk WHERE harga_jual <= harga_beli AND aktif = 1

-- Promo products (by name)
SELECT kode, nama, harga_jual FROM produk WHERE (nama LIKE '%lambat%' OR nama LIKE '%slow%' OR nama LIKE '%sabar%' OR nama LIKE '%murah%' OR nama LIKE '%promo%') AND aktif = 1

-- Regular vs Promo comparison
SELECT 
    CASE 
        WHEN harga_jual <= harga_beli OR nama LIKE '%lambat%' OR nama LIKE '%slow%' OR nama LIKE '%sabar%' THEN 'Promo'
        ELSE 'Regular'
    END as product_type,
    COUNT(*) as total_products,
    AVG(harga_jual) as avg_price
FROM produk 
WHERE aktif = 1
GROUP BY CASE 
    WHEN harga_jual <= harga_beli OR nama LIKE '%lambat%' OR nama LIKE '%slow%' OR nama LIKE '%sabar%' THEN 'Promo'
    ELSE 'Regular'
END
```

### Transaction Analysis
```sql
-- Daily summary
SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 20 THEN 1 END) as success,
    COUNT(CASE WHEN status >= 40 THEN 1 END) as failed,
    SUM(harga) as amount,
    SUM(harga - ISNULL(harga_beli, 0)) as profit
FROM transaksi 
WHERE CAST(tgl_entri AS DATE) = CAST(GETDATE() AS DATE)

-- Promo token performance (last 7 days)
SELECT 
    t.kode_produk,
    p.nama,
    COUNT(*) as total,
    SUM(t.harga) as amount,
    SUM(t.harga - ISNULL(t.harga_beli, 0)) as profit
FROM transaksi t
JOIN produk p ON t.kode_produk = p.kode
WHERE t.status = 20
  AND t.tgl_entri >= DATEADD(day, -7, GETDATE())
  AND p.kode_operator IN ('PMP', 'PML')
GROUP BY t.kode_produk, p.nama
ORDER BY total DESC

-- Fast vs slow tokens
SELECT 
    CASE 
        WHEN p.kode_operator IN ('P', 'PM') THEN 'Fast'
        WHEN p.kode_operator IN ('PMP', 'PML') THEN 'Slow'
        ELSE 'Other'
    END as type,
    COUNT(*) as total,
    SUM(t.harga) as amount,
    SUM(t.harga - ISNULL(t.harga_beli, 0)) as profit
FROM transaksi t
JOIN produk p ON t.kode_produk = p.kode
WHERE t.tgl_entri >= DATEADD(day, -7, GETDATE())
  AND p.catatan LIKE '%TOKEN%'
GROUP BY CASE 
    WHEN p.kode_operator IN ('P', 'PM') THEN 'Fast'
    WHEN p.kode_operator IN ('PMP', 'PML') THEN 'Slow'
    ELSE 'Other'
END

-- Top 10 products
SELECT TOP 10
    t.kode_produk,
    p.nama,
    COUNT(*) as total,
    SUM(t.harga) as amount,
    SUM(t.harga - ISNULL(t.harga_beli, 0)) as profit,
    CAST(COUNT(CASE WHEN t.status = 20 THEN 1 END) * 100.0 / COUNT(*) AS DECIMAL(5,2)) as success_rate
FROM transaksi t
JOIN produk p ON t.kode_produk = p.kode
WHERE t.tgl_entri >= DATEADD(day, -7, GETDATE())
GROUP BY t.kode_produk, p.nama
ORDER BY total DESC

-- By reseller level
SELECT 
    r.kode_level,
    COUNT(DISTINCT t.kode_reseller) as resellers,
    COUNT(*) as total,
    SUM(t.harga) as amount,
    SUM(t.harga - ISNULL(t.harga_beli, 0)) as profit
FROM transaksi t
JOIN reseller r ON t.kode_reseller = r.kode
WHERE t.status = 20
  AND t.tgl_entri >= DATEADD(day, -7, GETDATE())
GROUP BY r.kode_level
ORDER BY amount DESC

-- Hourly pattern
SELECT 
    DATEPART(hour, tgl_entri) as hour,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 20 THEN 1 END) as success
FROM transaksi
WHERE tgl_entri >= DATEADD(day, -7, GETDATE())
GROUP BY DATEPART(hour, tgl_entri)
ORDER BY hour

-- Failed analysis
SELECT 
    status,
    CASE 
        WHEN status = 43 THEN 'Saldo Tidak Cukup'
        WHEN status = 46 THEN 'Transaksi Dobel'
        WHEN status = 47 THEN 'Produk Gangguan'
        WHEN status = 55 THEN 'Timeout'
        ELSE 'Other'
    END as reason,
    COUNT(*) as total
FROM transaksi
WHERE status >= 40
  AND tgl_entri >= DATEADD(day, -7, GETDATE())
GROUP BY status
ORDER BY total DESC
```

## Time Ranges
```sql
-- Last 7 days: WHERE tgl_entri >= DATEADD(day, -7, GETDATE())
-- Last 30 days: WHERE tgl_entri >= DATEADD(day, -30, GETDATE())
-- Today: WHERE CAST(tgl_entri AS DATE) = CAST(GETDATE() AS DATE)
-- Yesterday: WHERE CAST(tgl_entri AS DATE) = CAST(DATEADD(day, -1, GETDATE()) AS DATE)
-- This month: WHERE YEAR(tgl_entri) = YEAR(GETDATE()) AND MONTH(tgl_entri) = MONTH(GETDATE())
```

## Quick Reference
- **Promo/slow tokens**: `kode_operator IN ('PMP', 'PML')` OR `nama LIKE '%lambat%'` OR `harga_jual <= harga_beli`
- **Fast tokens**: `kode_operator IN ('P', 'PM')`
- **All tokens**: `catatan LIKE '%TOKEN%'`
- **Promo products**: `harga_jual <= harga_beli` OR `nama LIKE '%lambat%' OR nama LIKE '%slow%' OR nama LIKE '%sabar%' OR nama LIKE '%murah%'`
- **Regular products**: `harga_jual > harga_beli` AND no slow keywords in name
- **Success status**: `status = 20`
- **Failed status**: `status >= 40 AND status <= 72`
- **Pending status**: `status IN (0,1,2,3,5)`
- **Active products**: `aktif = 1 AND gangguan = 0`
- **Active resellers**: `aktif = 1 AND deleted = 0`
- **Inactive members**: `tgl_aktivitas <= DATEADD(day, -7, GETDATE())`
- **Get phone from pengirim**: `LEFT JOIN pengirim p ON r.kode = p.kode_reseller` then use `COALESCE(p.pengirim, r.nomor_hp)`
- **Phone priority (S > W)**: Filter by `tipe_pengirim IN ('S', 'W')` and use `ROW_NUMBER() OVER (PARTITION BY r.kode ORDER BY CASE WHEN p.tipe_pengirim = 'S' THEN 1 WHEN p.tipe_pengirim = 'W' THEN 2 END)` to get one phone per member

## Best Practices
1. Always use indexed columns: kode, kode_reseller, tgl_entri, tanggal
2. Use TOP for large tables (transaksi, mutasi)
3. Filter by aktif = 1 for active records
4. Use CAST for date comparisons
5. Include both amount and profit in financial reports
6. Use CASE for status text in user-facing reports
7. Never query schema - use this documentation
8. Identify promo products by: price (harga_jual <= harga_beli) OR name keywords (lambat/slow/sabar/murah)
9. When exporting to CSV: use CONVERT(VARCHAR, date_column, 120) for dates, REPLACE() to escape commas in text fields
10. Join pengirim table to get phone numbers: `LEFT JOIN pengirim p ON r.kode = p.kode_reseller`, then use `COALESCE(p.pengirim, r.nomor_hp)`

## Member Data Export
To export member data with phone numbers from pengirim table:

### Basic Export (with duplicate members for multiple phone numbers)
```sql
-- Get inactive members (last active 7+ days ago) with phone numbers
SELECT 
    r.kode AS NAMAMEMBER,
    r.saldo AS SALDO,
    COALESCE(p.pengirim, r.nomor_hp) AS NOHP,
    r.kode_upline AS UPLINE,
    CONVERT(VARCHAR, r.tgl_daftar, 120) AS TGLDAFTAR,
    CONVERT(VARCHAR, r.tgl_aktivitas, 120) AS LASTAKTIF,
    REPLACE(REPLACE(r.alamat, ',', ';'), CHAR(13) + CHAR(10), ' ') AS ALAMAT
FROM reseller r
LEFT JOIN pengirim p ON r.kode = p.kode_reseller
WHERE r.tgl_aktivitas < DATEADD(day, -7, GETDATE())
ORDER BY r.tgl_aktivitas DESC
```

### Deduplicated Export (one phone per member, priority S > W)
```sql
-- Get inactive members with one phone number per member (prioritize S over W)
WITH RankedPhones AS (
    SELECT 
        r.kode,
        r.saldo,
        r.kode_upline,
        r.tgl_daftar,
        r.tgl_aktivitas,
        r.alamat,
        p.pengirim,
        p.tipe_pengirim,
        ROW_NUMBER() OVER (
            PARTITION BY r.kode 
            ORDER BY 
                CASE 
                    WHEN p.tipe_pengirim = 'S' THEN 1
                    WHEN p.tipe_pengirim = 'W' THEN 2
                    ELSE 3
                END,
                p.pengirim
        ) as rn
    FROM reseller r
    LEFT JOIN pengirim p ON r.kode = p.kode_reseller 
        AND p.tipe_pengirim IN ('S', 'W')
    WHERE r.tgl_aktivitas <= DATEADD(day, -7, GETDATE())
      AND r.saldo <= 10000
)
SELECT 
    kode AS NAMAMEMBER,
    saldo AS SALDO,
    COALESCE(pengirim, '') AS NOHP,
    kode_upline AS UPLINE,
    CONVERT(VARCHAR, tgl_daftar, 120) AS TGLDAFTAR,
    CONVERT(VARCHAR, tgl_aktivitas, 120) AS LASTAKTIF,
    REPLACE(REPLACE(alamat, ',', ';'), CHAR(13) + CHAR(10), ' ') AS ALAMAT
FROM RankedPhones
WHERE rn = 1
ORDER BY tgl_aktivitas DESC
```

**Notes**:
- Use `COALESCE(p.pengirim, r.nomor_hp)` to get phone from pengirim table first, fallback to reseller.nomor_hp
- A reseller may have multiple entries in pengirim (multiple phone numbers)
- **Phone number types**: S (SMS, priority) and W (WhatsApp, secondary)
- For deduplicated export: Use `ROW_NUMBER()` with `PARTITION BY` to get one phone per member
- Priority order: S (1) > W (2) > others (3)
- Filter by `tipe_pengirim IN ('S', 'W')` to only get SMS and WhatsApp numbers
- Use `CONVERT(VARCHAR, date, 120)` for ISO date format (YYYY-MM-DD HH:MM:SS)
- Replace commas in alamat with semicolons to avoid CSV parsing issues
- Adjust days in `DATEADD(day, -7, GETDATE())` for different inactive periods
