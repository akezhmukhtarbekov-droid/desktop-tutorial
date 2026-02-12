const form = document.getElementById("loginForm");
const iinInput = document.getElementById("iin");
const passwordInput = document.getElementById("password");
const errorEl = document.getElementById("error");
const user = await pool.query(
  "SELECT * FROM users WHERE iin = $1",
  [iin]
);

if (user.rows.length === 0) {
  return res.status(401).json({ error: "Пользователь не найден" });
}

const valid = await bcrypt.compare(password, user.rows[0].password);

if (!valid) {
  return res.status(401).json({ error: "Неверный пароль" });
}


form.addEventListener("submit", async (e) => {
  e.preventDefault(); // не даём форме перезагрузить страницу

  const iin = iinInput.value.trim();
  const password = passwordInput.value.trim();

  // простая проверка на пустоту
  if (!iin || !password) {
    errorEl.textContent = "Заполните ИИН и пароль";
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ iin, password })
    });

    const data = await response.json();

    if (!data.success) {
      // если бекэнд вернул ошибку
      errorEl.textContent = data.message || "Ошибка входа";
      return;
    }

    // если всё ок — очищаем ошибку
    errorEl.textContent = "";

    // здесь можно:
    // 1) перенаправить на другую страницу
    // 2) показать личный кабинет
    // 3) сохранить что-то в localStorage

    // Пример: редирект на главную
    window.location.href = "/index.html";
  } catch (err) {
    console.error(err);
    errorEl.textContent = "Сервер недоступен. Попробуйте позже.";
  }
});function validateIIN(iin) {
  if (!/^\d{12}$/.test(iin)) return false;

  const digits = iin.split("").map(Number);

  const k1 = [1,2,3,4,5,6,7,8,9,10,11];
  const k2 = [3,4,5,6,7,8,9,10,11,1,2];

  let sum = 0;

  for (let i = 0; i < 11; i++) {
    sum += digits[i] * k1[i];
  }

  let control = sum % 11;

  if (control === 10) {
    sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * k2[i];
    }
    control = sum % 11;
  }

  return control === digits[11];
}
if (!validateIIN(iin)) {
  errorEl.textContent = "ИИН недействителен";
  return;
}