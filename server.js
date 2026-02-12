const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
const express = require("express");
const path = require("path");
const pool = require("./db");
const app = express();
// Middleware
app.use(express.json());
app.use(express.static(__dirname)); // Раздача статических файлов

// ========================================
// АУТЕНТИФИКАЦИЯ
// ========================================

// Регистрация
app.post("/api/register", async (req, res) => {
  const { iin, password, full_name, phone } = req.body;

  if (!iin || !password || !full_name) {
    return res.status(400).json({
      success: false,
      message: "Заполните все обязательные поля"
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (iin, password, full_name, phone) VALUES ($1, $2, $3, $4) RETURNING *",
      [iin, password, full_name, phone]
    );

    res.json({
      success: true,
      message: "Регистрация успешна!",
      user: { iin: result.rows[0].iin, name: result.rows[0].full_name }
    });
  } catch (error) {
    if (error.code === '23505') { // Дубликат ИИН
      res.status(400).json({
        success: false,
        message: "Пользователь с таким ИИН уже существует"
      });
    } else {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Ошибка сервера"
      });
    }
  }
});

// Вход
app.post("/api/login", async (req, res) => {
  const { iin, password } = req.body;

  if (!iin || !password) {
    return res.status(400).json({
      success: false,
      message: "ИИН и пароль обязательны"
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE iin = $1 AND password = $2",
      [iin, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Неверный ИИН или пароль"
      });
    }

    const user = result.rows[0];
    res.json({
      success: true,
      message: "Успешный вход",
      user: { 
        iin: user.iin, 
        name: user.full_name,
        phone: user.phone 
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ошибка сервера"
    });
  }
});

// ========================================
// ЗАПИСЬ В БОЛЬНИЦУ
// ========================================

// Создать запись
app.post("/api/appointments", async (req, res) => {
  const { user_iin, hospital, department, doctor, appointment_date, appointment_time } = req.body;

  if (!user_iin || !hospital || !appointment_date || !appointment_time) {
    return res.status(400).json({
      success: false,
      message: "Заполните все обязательные поля"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO appointments (user_iin, hospital, department, doctor, appointment_date, appointment_time)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [user_iin, hospital, department, doctor, appointment_date, appointment_time]
    );

    res.json({
      success: true,
      message: "Запись успешно создана!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ошибка при создании записи"
    });
  }
});

// Получить все записи пользователя
app.get("/api/appointments/:iin", async (req, res) => {
  const { iin } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM appointments WHERE user_iin = $1 ORDER BY created_at DESC",
      [iin]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ошибка получения записей"
    });
  }
});

// ========================================
// ВОССТАНОВЛЕНИЕ ДОКУМЕНТОВ
// ========================================

// Создать заявку на документ
app.post("/api/document-requests", async (req, res) => {
  const { user_iin, document_type, reason } = req.body;

  if (!user_iin || !document_type) {
    return res.status(400).json({
      success: false,
      message: "Укажите тип документа"
    });
  }

  try {
    // Генерируем номер заявки
    const request_number = `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await pool.query(
      `INSERT INTO document_requests (user_iin, document_type, reason, request_number)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_iin, document_type, reason, request_number]
    );

    res.json({
      success: true,
      message: "Заявка принята!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ошибка при создании заявки"
    });
  }
});

// Получить заявки пользователя
app.get("/api/document-requests/:iin", async (req, res) => {
  const { iin } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM document_requests WHERE user_iin = $1 ORDER BY created_at DESC",
      [iin]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ошибка получения заявок"
    });
  }
});

// ========================================
// СПРАВКИ
// ========================================

// Запросить справку
app.post("/api/certificates", async (req, res) => {
  const { user_iin, certificate_type } = req.body;

  if (!user_iin || !certificate_type) {
    return res.status(400).json({
      success: false,
      message: "Укажите тип справки"
    });
  }

  try {
    const request_number = `CERT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await pool.query(
      `INSERT INTO certificate_requests (user_iin, certificate_type, request_number)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_iin, certificate_type, request_number]
    );

    res.json({
      success: true,
      message: "Заявка на справку принята!",
      data: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ошибка при создании заявки"
    });
  }
});

// Получить справки пользователя
app.get("/api/certificates/:iin", async (req, res) => {
  const { iin } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM certificate_requests WHERE user_iin = $1 ORDER BY created_at DESC",
      [iin]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Ошибка получения справок"
    });
  }
});
