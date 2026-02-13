const pool = require("./db.js").default || require("./db.js");
pool.query("SELECT NOW()")
  .then(res => console.log("📡 Подключение к базе работает:", res.rows[0]))
  .catch(err => console.error("❌ Ошибка подключения к базе:", err));
const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Хранилище данных в памяти
const users = [
  { iin: "091206551005", password: "qwerty123", full_name: "Тестовый Житель", phone: "+77001234567", role: "citizen" },
  { iin: "990101500123", password: "worker123", full_name: "Рабочий Иванов", phone: "+77001111111", role: "worker" },
  { iin: "880202600456", password: "admin123", full_name: "Администратор Петров", phone: "+77002222222", role: "admin" }
];

const complaints = [];
const workReports = [];

let complaintId = 1;

// ========================================
// АУТЕНТИФИКАЦИЯ
// ========================================

app.post("/api/register", (req, res) => {
  const { iin, password, full_name, phone } = req.body;

  if (!iin || !password || !full_name) {
    return res.status(400).json({ success: false, message: "Заполните все обязательные поля" });
  }

  const existing = users.find(u => u.iin === iin);
  if (existing) {
    return res.status(400).json({ success: false, message: "Пользователь с таким ИИН уже существует" });
  }

  const newUser = { iin, password, full_name, phone, role: "citizen" };
  users.push(newUser);

  console.log("✅ Пользователь создан:", newUser.full_name);

  res.json({ success: true, message: "Регистрация успешна!", user: { iin: newUser.iin, name: newUser.full_name, role: newUser.role } });
});

app.post("/api/login", (req, res) => {
  const { iin, password } = req.body;

  if (!iin || !password) {
    return res.status(400).json({ success: false, message: "ИИН и пароль обязательны" });
  }

  const user = users.find(u => u.iin === iin && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, message: "Неверный ИИН или пароль" });
  }

  console.log("✅ Вход успешен:", user.full_name);

  res.json({ success: true, message: "Успешный вход", user: { iin: user.iin, name: user.full_name, phone: user.phone, role: user.role } });
});

// ========================================
// ЖАЛОБЫ (Модуль Активный Житель)
// ========================================

app.post("/api/complaints", (req, res) => {
  const { user_iin, category, description, address, latitude, longitude, photo_before } = req.body;

  if (!user_iin || !category || !description || !address) {
    return res.status(400).json({ success: false, message: "Заполните все обязательные поля" });
  }

  const newComplaint = {
    id: complaintId++,
    user_iin,
    category,
    description,
    address,
    latitude: latitude || null,
    longitude: longitude || null,
    photo_before: photo_before || null,
    status: "Принято",
    assigned_worker: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  complaints.push(newComplaint);

  console.log("✅ Жалоба создана #" + newComplaint.id);

  res.json({ success: true, message: "Жалоба успешно отправлена!", data: newComplaint });
});

// Получить жалобы пользователя
app.get("/api/complaints/user/:iin", (req, res) => {
  const { iin } = req.params;
  const userComplaints = complaints.filter(c => c.user_iin === iin);
  res.json({ success: true, data: userComplaints });
});

// Получить все жалобы (для админа/сотрудника)
app.get("/api/complaints", (req, res) => {
  res.json({ success: true, data: complaints });
});

// Получить жалобы для конкретного сотрудника
app.get("/api/complaints/worker/:iin", (req, res) => {
  const { iin } = req.params;
  const workerComplaints = complaints.filter(c => c.assigned_worker === iin);
  res.json({ success: true, data: workerComplaints });
});

// ========================================
// НАЗНАЧЕНИЕ ЗАДАЧ (Модуль Админ)
// ========================================

app.post("/api/complaints/:id/assign", (req, res) => {
  const { id } = req.params;
  const { worker_iin } = req.body;

  const complaint = complaints.find(c => c.id == id);

  if (!complaint) {
    return res.status(404).json({ success: false, message: "Жалоба не найдена" });
  }

  complaint.assigned_worker = worker_iin;
  complaint.status = "В работе";
  complaint.updated_at = new Date().toISOString();

  console.log(`✅ Жалоба #${id} назначена сотруднику ${worker_iin}`);

  res.json({ success: true, message: "Задача назначена!", data: complaint });
});

// ========================================
// ОТЧЁТЫ О РАБОТЕ (Модуль Сотрудник)
// ========================================

app.post("/api/work-reports", (req, res) => {
  const { complaint_id, worker_iin, photo_after, work_duration, comment } = req.body;

  if (!complaint_id || !worker_iin || !photo_after) {
    return res.status(400).json({ success: false, message: "Загрузите фото после работы" });
  }

  const complaint = complaints.find(c => c.id == complaint_id);

  if (!complaint) {
    return res.status(404).json({ success: false, message: "Жалоба не найдена" });
  }

  const newReport = {
    id: workReports.length + 1,
    complaint_id,
    worker_iin,
    photo_after,
    work_duration: work_duration || null,
    comment: comment || "",
    completed_at: new Date().toISOString()
  };

  workReports.push(newReport);

  // Обновляем статус жалобы
  complaint.status = "Выполнено";
  complaint.updated_at = new Date().toISOString();

  console.log("✅ Отчёт о работе создан для жалобы #" + complaint_id);

  res.json({ success: true, message: "Отчёт отправлен!", data: newReport });
});

// Получить отчёты
app.get("/api/work-reports/:complaint_id", (req, res) => {
  const { complaint_id } = req.params;
  const reports = workReports.filter(r => r.complaint_id == complaint_id);
  res.json({ success: true, data: reports });
});

// ========================================
// СТАТИСТИКА (Модуль Админ)
// ========================================

app.get("/api/statistics", (req, res) => {
  const total = complaints.length;
  const completed = complaints.filter(c => c.status === "Выполнено").length;
  const inProgress = complaints.filter(c => c.status === "В работе").length;
  const pending = complaints.filter(c => c.status === "Принято").length;

  const categoriesCount = {};
  complaints.forEach(c => {
    categoriesCount[c.category] = (categoriesCount[c.category] || 0) + 1;
  });

  res.json({
    success: true,
    data: {
      total,
      completed,
      inProgress,
      pending,
      categoriesCount
    }
  });
});

// ========================================
// ЗАПУСК СЕРВЕРА
// ========================================

app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log("🚀 ГОРОДСКАЯ СИСТЕМА УПРАВЛЕНИЯ ЗАПУЩЕНА!");
  console.log("=".repeat(60));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log();
  console.log("✅ Данные хранятся в памяти");
  console.log(`✅ Зарегистрировано пользователей: ${users.length}`);
  console.log();
  console.log("🔑 Тестовые аккаунты:");
  console.log("   Житель: ИИН 091206551005, пароль qwerty123");
  console.log("   Сотрудник: ИИН 990101500123, пароль worker123");
  console.log("   Админ: ИИН 880202600456, пароль admin123");
  console.log();
  console.log("📖 Откройте в браузере:");
  console.log(`   http://localhost:${PORT}/index.html`);
  console.log("=".repeat(60));
});