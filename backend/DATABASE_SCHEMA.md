# DATABASE SCHEMA — Lapis AI V3.0

**Status:** Living Document  
**Last Updated:** 2026-05-03  
**Migration Files:** migrate.js (V1) → migrate2.js (V2)

---

## ARSITEKTUR STORAGE

```
+------------------+---------------------+-----------------------+
|   PostgreSQL     |    TimescaleDB      |        Redis          |
|   Port: 5434     |    Port: 5433       |      Port: 6379       |
|   lapis_ai_db    | lapis_timeseries_db |     Cache Layer       |
+------------------+---------------------+-----------------------+
| Data relasional  | Data time-series    | Snapshot real-time    |
| dan bisnis       | sensor & prediksi   | per mesin (TTL 15min) |
+------------------+---------------------+-----------------------+
```

---

## POSTGRESQL — lapis_ai_db

### Tabel: users
**Fungsi:** Akun teknisi dan admin (login only, no register)  
**Migration:** migrate2.js

```
+---------------+--------------+---------------------------+
| Kolom         | Tipe         | Keterangan                |
+---------------+--------------+---------------------------+
| id            | SERIAL PK    | Auto-increment            |
| username      | VARCHAR(50)  | UNIQUE NOT NULL           |
| email         | VARCHAR(100) | UNIQUE NOT NULL           |
| password_hash | VARCHAR(255) | NOT NULL — bcrypt hash    |
| role          | VARCHAR(20)  | admin / technician        |
| is_active     | BOOLEAN      | DEFAULT true              |
| last_login    | TIMESTAMPTZ  | nullable                  |
| created_at    | TIMESTAMPTZ  | DEFAULT NOW()             |
| updated_at    | TIMESTAMPTZ  | DEFAULT NOW()             |
+---------------+--------------+---------------------------+
```

Indexes: idx_users_email, idx_users_role

Seed Accounts:
- admin@lapis-ai.com → role: admin
- tech01@lapis-ai.com → role: technician

---

### Tabel: machines
**Fungsi:** Master data 20 mesin M-01 s/d M-20  
**Migration:** migrate2.js

```
+-------------+--------------+------------------------------------+
| Kolom       | Tipe         | Keterangan                         |
+-------------+--------------+------------------------------------+
| machine_id  | VARCHAR(10)  | PRIMARY KEY — format M-XX          |
| name        | VARCHAR(100) | NOT NULL                           |
| location    | VARCHAR(100) | nullable — area pabrik             |
| description | TEXT         | nullable                           |
| status      | VARCHAR(20)  | healthy/warning/critical/offline   |
| installed_at| DATE         | nullable                           |
| created_at  | TIMESTAMPTZ  | DEFAULT NOW()                      |
| updated_at  | TIMESTAMPTZ  | DEFAULT NOW()                      |
+-------------+--------------+------------------------------------+
```

Seed: 20 mesin (M-01 s/d M-20), status default: healthy

---

### Tabel: maintenance_logs
**Fungsi:** Riwayat historis perbaikan dari teknisi  
**Migration:** migrate.js (V1)

```
+------------------+--------------+-------------------------------+
| Kolom            | Tipe         | Keterangan                    |
+------------------+--------------+-------------------------------+
| log_id           | VARCHAR(20)  | PRIMARY KEY — format ML-XXXX  |
| date             | DATE         | NOT NULL                      |
| machine_id       | VARCHAR(10)  | NOT NULL                      |
| type             | VARCHAR(20)  | Preventive / Corrective       |
| technician_notes | TEXT         | nullable                      |
| part_replaced    | VARCHAR(100) | nullable                      |
| downtime_hrs     | NUMERIC(6,2) | nullable                      |
| cost_idr         | BIGINT       | nullable — dalam Rupiah       |
| created_at       | TIMESTAMPTZ  | DEFAULT NOW()                 |
+------------------+--------------+-------------------------------+
```

Indexes: idx_maintenance_machine_id, idx_maintenance_date

---

### Tabel: maintenance_schedules
**Fungsi:** Output Safety Margin Calculator — jadwal servis otomatis  
**Migration:** migrate2.js

```
+--------------------+--------------+-----------------------------------+
| Kolom              | Tipe         | Keterangan                        |
+--------------------+--------------+-----------------------------------+
| id                 | SERIAL PK    | Auto-increment                    |
| machine_id         | VARCHAR(10)  | FK → machines.machine_id          |
| rul_days           | INTEGER      | NOT NULL — RUL saat dibuat        |
| scheduled_date     | DATE         | NOT NULL — tanggal servis         |
| safety_margin_date | DATE         | NOT NULL — tanggal dengan buffer  |
| priority           | VARCHAR(20)  | low/normal/high/critical          |
| status             | VARCHAR(20)  | pending/in_progress/completed/    |
|                    |              | cancelled                         |
| notes              | TEXT         | nullable                          |
| created_at         | TIMESTAMPTZ  | DEFAULT NOW()                     |
| updated_at         | TIMESTAMPTZ  | DEFAULT NOW()                     |
+--------------------+--------------+-----------------------------------+
```

Indexes: idx_schedules_machine_id, idx_schedules_status,
idx_schedules_scheduled_date

---

### Tabel: documents
**Fungsi:** Metadata registry dokumen SOP/Manual yang diupload admin  
**Migration:** migrate2.js

CATATAN: Tabel ini HANYA menyimpan metadata.
Konten dokumen (vector embeddings) disimpan di Vector DB
(Chroma/Qdrant) oleh NLP Engine (Role D).

```
+--------------+--------------+------------------------------------+
| Kolom        | Tipe         | Keterangan                         |
+--------------+--------------+------------------------------------+
| id           | SERIAL PK    | Auto-increment                     |
| filename     | VARCHAR(255) | NOT NULL — nama file di storage    |
| original_name| VARCHAR(255) | NOT NULL — nama asli saat upload   |
| file_type    | VARCHAR(10)  | pdf / docx / txt                   |
| file_size    | INTEGER      | NOT NULL — ukuran dalam bytes      |
| storage_path | VARCHAR(500) | NOT NULL — path file di server     |
| index_status | VARCHAR(20)  | pending/processing/indexed/failed  |
| uploaded_by  | INTEGER      | FK → users.id                      |
| created_at   | TIMESTAMPTZ  | DEFAULT NOW()                      |
+--------------+--------------+------------------------------------+
```

---

### Tabel: alerts
**Fungsi:** Riwayat alert kritis yang dikirim ke Frontend via WebSocket  
**Migration:** migrate2.js

```
+------------+--------------+------------------------------------------+
| Kolom      | Tipe         | Keterangan                               |
+------------+--------------+------------------------------------------+
| id         | SERIAL PK    | Auto-increment                           |
| machine_id | VARCHAR(10)  | FK → machines.machine_id                 |
| type       | VARCHAR(30)  | health_critical / health_warning /       |
|            |              | rul_critical / maintenance_due           |
| message    | TEXT         | NOT NULL — isi pesan alert               |
| severity   | VARCHAR(20)  | info / warning / critical                |
| is_read    | BOOLEAN      | DEFAULT false                            |
| created_at | TIMESTAMPTZ  | DEFAULT NOW()                            |
+------------+--------------+------------------------------------------+
```

Indexes: idx_alerts_machine_id, idx_alerts_is_read, idx_alerts_created_at

---

## TIMESCALEDB — lapis_timeseries_db

### Hypertable: sensor_readings
**Fungsi:** Time-series rekaman sensor IoT dari 20 mesin  
**Migration:** migrate.js (V1)  
**Partition:** by timestamp (auto-chunked oleh TimescaleDB)

```
+-------------------+---------------+--------------------------------+
| Kolom             | Tipe          | Keterangan                     |
+-------------------+---------------+--------------------------------+
| timestamp         | TIMESTAMPTZ   | Partition key — waktu rekaman  |
| machine_id        | VARCHAR(10)   | ID mesin                       |
| temperature       | NUMERIC(6,2)  | Suhu operasional (C)           |
| vibration         | NUMERIC(8,4)  | Tingkat getaran                |
| pressure          | NUMERIC(8,2)  | Tekanan operasional            |
| rpm               | INTEGER       | Rotasi per menit               |
| power_consumption | NUMERIC(8,2)  | Konsumsi daya (kW)             |
| noise_level       | NUMERIC(6,2)  | Tingkat kebisingan (dB)        |
| humidity          | NUMERIC(5,2)  | Kelembaban (%)                 |
| operating_hours   | NUMERIC(10,2) | Total jam operasi akumulatif   |
| created_at        | TIMESTAMPTZ   | DEFAULT NOW()                  |
+-------------------+---------------+--------------------------------+
```

Indexes: idx_sensor_machine_id on (machine_id, timestamp DESC)

---

### Hypertable: ml_predictions
**Fungsi:** Time-series hasil prediksi ML Engine per mesin  
**Migration:** migrate2.js (V2)  
**Partition:** by timestamp

CATATAN: DRAFT — akan disesuaikan setelah ML Engineer (Role B)
finalisasi response API mereka via migrate3.js.

```
+------------------+--------------+--------------------------------+
| Kolom            | Tipe         | Keterangan                     |
+------------------+--------------+--------------------------------+
| timestamp        | TIMESTAMPTZ  | Partition key                  |
| machine_id       | VARCHAR(10)  | ID mesin                       |
| health_score     | NUMERIC(5,2) | Skor kesehatan 0-100           |
| rul_days         | INTEGER      | Remaining Useful Life (hari)   |
| classification   | VARCHAR(20)  | HEALTHY / WARNING / CRITICAL   |
| confidence_score | NUMERIC(5,4) | Tingkat kepercayaan prediksi   |
| created_at       | TIMESTAMPTZ  | DEFAULT NOW()                  |
+------------------+--------------+--------------------------------+
```

Indexes: idx_ml_predictions_machine_id on (machine_id, timestamp DESC)

---

## REDIS CACHE SCHEMA

```
+-------------------------------+----------------------------+----------+
| Key Pattern                   | Value                      | TTL      |
+-------------------------------+----------------------------+----------+
| machine:{id}:last_reading     | JSON snapshot sensor       | 900s     |
| machine:{id}:prediction       | JSON hasil prediksi ML     | 900s     |
| session:{token}               | User session data          | 86400s   |
+-------------------------------+----------------------------+----------+
```

Keterangan TTL:
- 900s = 15 menit (data sensor & prediksi)
- 86400s = 24 jam (session)

---

## RELASI ANTAR TABEL

```
PostgreSQL (lapis_ai_db)
========================
machines (machine_id PK)
    |
    |--- maintenance_logs (machine_id) [logis, no FK enforce]
    |--- maintenance_schedules (machine_id FK)
    |--- alerts (machine_id FK)

users (id PK)
    |
    |--- documents (uploaded_by FK)

TimescaleDB (lapis_timeseries_db)
==================================
sensor_readings (machine_id) [logis — cross-DB, no FK enforce]
ml_predictions (machine_id)  [logis — cross-DB, no FK enforce]

CATATAN RELASI LINTAS DATABASE:
sensor_readings dan ml_predictions tidak bisa FK ke machines
karena berada di database berbeda. Integritas dijaga di
application layer (dispatcherService.js, mlService.js).
```

---

## MIGRATION HISTORY

```
+-------------+-------+------------+------------------------------------------+
| File        | Versi | Tanggal    | Isi                                      |
+-------------+-------+------------+------------------------------------------+
| migrate.js  | V1    | 2026-04-29 | sensor_readings (hypertable),            |
|             |       |            | maintenance_logs                         |
+-------------+-------+------------+------------------------------------------+
| migrate2.js | V2    | 2026-05-03 | users, machines, maintenance_schedules,  |
|             |       |            | documents, alerts, ml_predictions        |
|             |       |            | (hypertable) + seed 20 machines          |
+-------------+-------+------------+------------------------------------------+
| migrate3.js | V3    | TBD        | Penyesuaian post ML/NLP API contract     |
+-------------+-------+------------+------------------------------------------+
```

---

## CHANGELOG

```
+------------+--------------------------------------------------+
| Tanggal    | Perubahan                                        |
+------------+--------------------------------------------------+
| 2026-04-29 | V1 — Initial schema                              |
| 2026-05-03 | V2 — Complete schema sesuai Blueprint V3.0       |
| TBD        | V3 — Adjustment post ML/NLP integration          |
+------------+--------------------------------------------------+
```