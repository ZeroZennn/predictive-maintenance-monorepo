# PRIME Architecture Breakdown (End-to-End Data Flow)

Dokumen ini melacak alur data dari Predictive Reliability & Intelligence Maintenance Engine (PRIME) melalui empat fase utama: Data Simulation, ML & DL Inference, Backend API Serving, dan Frontend Integration & Visualization.

---

## Fase 1: Data Simulation (Input)
**File Path:** `backend/src/services/simulatorService.js`  
**Method Name:** `processTick()`

### Core Code Snippet
```javascript
// [ALUR PRIME] FASE 1: Data Simulation (Input). Fungsi ini bertanggung jawab untuk mensimulasikan streaming data historis sensor. Fungsi mengirimkan HTTP POST (seolah-olah data dari sensor asli secara real-time) ke endpoint ingestion backend untuk diproses lebih lanjut.
/**
 * Sends one group (all machines at a given timestamp) to the telemetry
 * ingest endpoint, then advances the index and broadcasts progress.
 */
async processTick() {
  // ...
  await Promise.all(
    group.rows.map(async (row) => {
      try {
        await axios.post(
          'http://localhost:3000/api/telemetry/ingest',
          {
            machine_id: row.machine_id,
            timestamp:  row.timestamp,
            sensors: {
              temperature:parseFloat(row.temperature),
              // ... (other sensors)
            },
          },
          { timeout: 10000 }
        );
      } catch (err) {
        // ...
      }
    })
  );
  // ...
}
```

### Penjelasan Singkat
Fungsi ini bertindak sebagai titik awal (starting point) dari jalur data (data pipeline). Fungsi ini membaca baris-baris dari dataset riwayat `sensor_readings.csv`, mengelompokkannya berdasarkan timestamp (mewakili satu "tick"), dan mensimulasikan aliran data real-time. Dengan mengirimkan permintaan HTTP POST secara paralel yang berisi data telemetri ke endpoint ingestion pada backend, fungsi ini secara akurat meniru sensor fisik nyata yang sedang mengirimkan data ke sistem. Aliran data simulasi yang berkelanjutan ini membentuk muatan (payload) yang nantinya akan diteruskan oleh backend ke dalam pipeline Machine Learning.

---

## Fase 2: ML & DL Inference (Processing)
**File Path:** `machine_learning/src/inference.py`  
**Function Name:** `predict()`

### Core Code Snippet
```python
# [ALUR PRIME] FASE 2: ML & DL Inference (Processing). Ini adalah fungsi utama (Core Logic) dimana model Machine Learning (Klasifikasi Status Kesehatan) dan Deep Learning (Regresi RUL) dieksekusi secara berjenjang (cascaded).
def predict(payload: dict,
            history_df: Optional[pd.DataFrame] = None) -> dict:
    # ... (Data preprocessing & feature extraction) ...

    # Step 4: Model 1 — Klasifikasi
    proba      = _classifier.predict_proba(current_features)  # (1, 3)
    pred_code  = int(_apply_threshold(proba)[0])
    pred_label = LABEL_MAP[pred_code]
    confidence = float(np.max(proba[0]))

    # Step 5: Model 2 — RUL (hanya jika WARNING atau CRITICAL)
    if pred_code in [1, 2]:
        lstm_input = _prepare_lstm_input(features)
        rul_raw    = float(_rul_model.predict(lstm_input, verbose=0)[0][0])
        rul_days   = max(0.0, round(rul_raw, 4))
        # ... 
```

### Penjelasan Singkat
Di sinilah pemrosesan inti dilakukan. Data yang masuk dari Fase 1 diubah melalui tahapan prapemrosesan (preprocessing pipeline). Fungsi `predict` ini menggunakan desain arsitektur berjenjang (cascaded):
1. Pertama, fungsi menjalankan model XGBoost (Klasifikasi) untuk menentukan Status Kesehatan Mesin (`HEALTHY`, `WARNING`, atau `CRITICAL`).
2. Jika ditemukan anomali (`WARNING` atau `CRITICAL`), fungsi ini kemudian akan memicu model Deep Learning LSTM (Regresi) yang memproses urutan pembacaan data historis untuk memprediksi Sisa Umur Pakai (RUL - Remaining Useful Life) dalam hitungan hari.

Dengan struktur seperti ini, model Deep Learning yang lebih berat hanya akan dieksekusi ketika benar-benar diperlukan, sehingga dapat mengoptimalkan efisiensi komputasi. Hasil prediksi (status, probabilitas, dan RUL) kemudian diformat dan dikembalikan ke sistem pemanggil (caller).

---

## Fase 3: Backend API (Serving)
**File Path:** `machine_learning/src/app.py`  
**Function/Endpoint:** `@app.post("/api/ml/predict")` (handled by `predict_endpoint`)

### Core Code Snippet
```python
# [ALUR PRIME] FASE 3: Backend API (Serving). Endpoint FastAPI ini berfungsi sebagai antarmuka API yang melayani (serving) model ke dunia luar. Menerima data sensor dan mengembalikan hasil prediksi (Health Status & RUL) dalam bentuk JSON.
@app.post("/api/ml/predict")
async def predict_endpoint(request: PredictRequest):
    """
    Endpoint utama prediksi ML.
    Model 1: Health Status Classification (HEALTHY/WARNING/CRITICAL)
    Model 2: RUL Prediction (aktif hanya jika WARNING atau CRITICAL)
    """
    payload = {
        "machine_id":      request.machine_id,
        "timestamp":       request.timestamp,
        "sensor_readings": request.sensor_readings.model_dump(),
    }
    
    # ... (Prepare history_df if provided) ...

    result = predict(payload, history_df=history_df)

    # ...
    return JSONResponse(status_code=200, content=result)
```

### Penjelasan Singkat
Ini adalah lapisan layanan mikro (microservice layer) yang dibangun dengan FastAPI. Lapisan ini menjembatani pemrosesan inti ML (Fase 2) dengan ekosistem aplikasi lainnya. Layanan ini menyediakan endpoint RESTful API (`/api/ml/predict`) yang menerima muatan JSON berupa pembacaan sensor mentah. Saat menerima permintaan, fungsi ini mem-parsing data, meneruskannya ke fungsi `predict`, dan membungkus hasil inferensi ke dalam format respon JSON HTTP standar. Backend Node.js (atau layanan klien lainnya) akan memanggil endpoint ini pada setiap 'tick' telemetri untuk mendapatkan kecerdasan analitik kesehatan mesin secara real-time.

---

## Fase 4: Frontend Integration & Visualization (Next.js)

Fase ini terdiri dari dua bagian: menerima data melalui WebSockets dan merendernya (menampilkannya) ke Antarmuka Pengguna (UI).

### Bagian A: Penerimaan Data (WebSocket Listener)
**File Path:** `frontend/src/components/providers/WebSocketInitializer.tsx`  
**Method Name:** `handleSensorUpdate()`

#### Core Code Snippet
```typescript
      // [ALUR PRIME] FASE 4: Frontend Integration & Visualization (Fetch Data). Bagian ini mendengarkan (listen) event WebSocket secara real-time dari backend untuk menerima data sensor dan hasil prediksi ML, lalu memperbarui state global (useMachineStore).
      const handleSensorUpdate = (data: any) => {
        if (!data.health_status) return; // Skip if no ML prediction yet

        useMachineStore.getState().updateMachineReading({
          machine_id: data.machine_id,
          timestamp: data.timestamp,
          sensors: data.sensor_live,
          prediction: {
            status: data.health_status.label,
            rul_days: data.rul.rul_days,
            confidence: data.health_status.confidence
          },
          // ...
        });
      };
```

### Bagian B: Tampilan UI (UI Rendering)
**File Path:** `frontend/src/components/dashboard/VitalSignBanner.tsx`  
**Component Name:** `VitalSignBanner`

#### Core Code Snippet
```tsx
// [ALUR PRIME] FASE 4: Frontend Integration & Visualization (UI Rendering). Komponen ini mengambil hasil prediksi (seperti rul_days dan probabilitas Health Status) dari global store dan merendernya menjadi elemen UI/indikator visual di dashboard.
export default function VitalSignBanner() {
  const selectedId = useMachineStore((state) => state.selectedMachineId) || "M-01";
  const machine = useMachineStore((state) => state.machines[selectedId]);

  // ... (Extract status, rul_days, probabilities) ...

  return (
    // ... JSX rendering logic ...
          {status === "HEALTHY" ? (
            <span className="text-[#5FDA0A] ...">
              Mesin dalam kondisi Prima
            </span>
          ) : (
            <div className="...">
              <span className="text-white">ESTIMATED RUL :</span>
              <span className={statusConfig[status].color}>{Math.round(rul_days)} DAYS</span>
            </div>
          )}
    // ...
  );
}
```

### Penjelasan Singkat
Frontend Next.js menghubungkan seluruh alur dengan menampilkan data secara langsung kepada pengguna akhir. 
- Pada **Bagian A**, `WebSocketInitializer` membuka koneksi terus-menerus dengan backend Node.js. Bagian ini terus mendengarkan (listening) kejadian (events) `sensor:update` yang berisi hasil inferensi terbaru (yang dihitung pada Fase 2 & 3) dan menyimpannya ke dalam status global Zustand (`useMachineStore`).
- Pada **Bagian B**, komponen `VitalSignBanner` bertindak sebagai tampilan yang reaktif. Komponen ini berlangganan (subscribe) pada `useMachineStore`, sehingga akan merender ulang tampilannya secara otomatis setiap kali ada data baru yang masuk. Komponen ini memvisualisasikan probabilitas Status Kesehatan saat ini dan, jika ditemukan anomali, akan menampilkan indikator parameter `rul_days` secara mencolok pada dashboard.

---

## Fase 5: Docker Containerization & Orchestration
**File Path:** `docker-compose.yml`

### Core Code Snippet
```yaml
services:
  backend:
    profiles: ["app"]
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: lapis_backend
    ports:
      - "${BACKEND_PORT:-3000}:3000"
    depends_on:
      postgres:
        condition: service_healthy
      timescaledb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - lapis_network

  frontend:
    profiles: ["app"]
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: lapis_frontend
    ports:
      - "3001:3000"
    depends_on:
      - backend
    networks:
      - lapis_network

  machine_learning:
    profiles: ["app"]
    build:
      context: ./machine_learning
      dockerfile: Dockerfile
    container_name: lapis_ml_engine
    ports:
      - "${ML_ENGINE_PORT:-8000}:8000"
    networks:
      - lapis_network

networks:
  lapis_network:
    driver: bridge
```

### Penjelasan Singkat
Fase ini menyoroti bagaimana seluruh arsitektur PRIME dibungkus dan dijalankan (orchestrated) secara bersamaan menggunakan Docker Compose. Berdasarkan konfigurasi di atas, terdapat beberapa service utama yang berjalan secara independen:
- **`frontend`** (Next.js) dan **`backend`** (Node.js) mengelola antarmuka pengguna dan logika bisnis.
- **`machine_learning`** (FastAPI/Python) menjalankan model AI untuk prediksi RUL dan klasifikasi anomali.
- Layanan infrastruktur dasar (seperti **`postgres`**, **`timescaledb`**, dan **`redis`**) menopang penyimpanan data riwayat dan cache.

Semua kontainer ini terhubung dan saling berkomunikasi secara internal melalui jaringan kustom yang disebut **`lapis_network`** (bridge network). Dengan cara ini, pertukaran data antar layanan (misalnya, backend yang mengirimkan data sensor telemetri langsung ke API ML) terjadi dengan cepat dan aman tanpa harus mengekspos semua port secara terbuka ke publik.

Selain itu, pendekatan *containerization* ini secara elegan memecahkan masalah bentrokan dependensi (*dependency conflicts*). Lingkungan Python yang sangat berat—dengan pustaka seperti TensorFlow, XGBoost, dan Pandas—diisolasi sepenuhnya di dalam kontainer `lapis_ml_engine`. Di sisi lain, ekosistem JavaScript/TypeScript beserta folder `node_modules` diisolasi dengan rapi pada kontainer `frontend` dan `backend` masing-masing. Hal ini memastikan setiap service beroperasi pada lingkungannya sendiri secara optimal dan tidak akan saling mengganggu, memberikan garansi stabilitas sistem baik selama tahap *development* hingga berjalan di fase *production*.
