# DATA DICTIONARY & SCHEMA: PROYEK LAPIS AI

## 1. sensor_readings.csv
Deskripsi: Data time-series dari 20 mesin yang direkam setiap jam. Terdapat ketimpangan data yang sangat ekstrem di mana status 'failure = 1' hanya sekitar 56 baris data dari 100,000 baris data ( 0.056% ) .

Daftar Kolom & Tipe Data:
- timestamp (datetime): Waktu perekaman (interval 1 jam).
- machine_id (string): ID unik mesin (misal: M-01 sampai M-20).
- temperature (float): Suhu operasional mesin.
- vibration (float): Tingkat getaran mesin.
- pressure (float): Tekanan operasional.
- rpm (int): Rotasi per menit.
- power_consumption (float): Konsumsi daya listrik.
- noise_level (float): Tingkat kebisingan.
- humidity (float): Tingkat kelembaban udara di sekitar mesin.
- operating_hours (int): Total jam operasi akumulatif mesin sejak pertama menyala.
- failure (int/boolean): LABEL TARGET BINER. 0 = Sehat, 1 = Rusak.

Sampel Data (Top 3 Rows):
timestamp, machine_id, temperature, vibration, pressure, rpm, power_consumption, noise_level, humidity, operating_hours, failure
2025-07-01 00:00, M-01, 72.3, 0.45, 101.2, 2500, 150.5, 45.2, 55.0, 1050, 0
2025-07-01 01:00, M-01, 73.1, 0.47, 101.5, 2510, 151.0, 45.5, 55.2, 1051, 0
...
2025-09-15 14:00, M-01, 89.7, 1.23, 112.8, 2900, 180.2, 85.0, 60.1, 2875, 1


## 2. maintenance_logs.csv
Deskripsi: Catatan historis perbaikan dari teknisi pabrik.

Daftar Kolom & Tipe Data:
- log_id (string): ID unik untuk setiap aktivitas maintenance.
- date (datetime): Tanggal perbaikan.
- machine_id (string): ID unik mesin yang diperbaiki.
- type (string): Jenis maintenance (Preventive atau Corrective).
- technician_notes (string): Catatan teks bebas mengenai keluhan atau kerusakan.
- part_replaced (string): Nama komponen atau suku cadang yang diganti.
- downtime_hrs (int): Lama mesin mati dalam jam akibat perbaikan.
- cost_idr (int): Total biaya perbaikan atau penggantian komponen dalam mata uang Rupiah.

Sampel Data (Top 2 Rows):
log_id, date, machine_id, type, technician_notes, downtime_hrs, part_replaced, cost_idr
ML-0001, 07/26/2025, M-06, Preventive, "Inspeksi rutin, ganti oli", 2.4, "Sensor", 2731555
ML-0002, 11/22/2025, M-08, Corrective, "Belt putus, ganti belt dan pulley", 9.6, "Seal", 9427034