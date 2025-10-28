const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Підключення до PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Тест підключення
pool.connect()
  .then(() => console.log('✅ Підключено до PostgreSQL!'))
  .catch(err => console.error('❌ Помилка підключення до БД:', err.message));

// Функція для запитів
async function executeQuery(sql, params = []) {
  try {
    const { rows } = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error('❌ Помилка запиту:', err.message);
    throw err;
  }
}

// Роути
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api', (req, res) => {
  res.json({ message: '🚗 Car API працює!' });
});

// Отримати всі авто
app.get('/api/cars', async (req, res) => {
  try {
    const results = await executeQuery('SELECT * FROM cars');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Отримати авто по ID
app.get('/api/cars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const results = await executeQuery('SELECT * FROM cars WHERE id = $1', [id]);
    if (results.length === 0) return res.status(404).json({ error: 'Авто не знайдено' });
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Додати авто
app.post('/api/cars', async (req, res) => {
  try {
    const { brand, model, year, price, registrationDate, mileage, fuelType } = req.body;
    const result = await executeQuery(
      `INSERT INTO cars (brand, model, year, price, registrationDate, mileage, fuelType)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [brand, model, year, price, registrationDate, mileage, fuelType]
    );
    res.status(201).json({ message: 'Автомобіль додано!', car: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Оновити авто
app.put('/api/cars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { brand, model, year, price, registrationDate, mileage, fuelType } = req.body;
    const result = await executeQuery(
      `UPDATE cars
       SET brand=$1, model=$2, year=$3, price=$4, registrationDate=$5, mileage=$6, fuelType=$7
       WHERE id=$8 RETURNING *`,
      [brand, model, year, price, registrationDate, mileage, fuelType, id]
    );
    if (result.length === 0) return res.status(404).json({ error: 'Авто не знайдено' });
    res.json({ message: 'Автомобіль оновлено!', car: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Видалити авто
app.delete('/api/cars/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await executeQuery('DELETE FROM cars WHERE id=$1 RETURNING *', [id]);
    if (result.length === 0) return res.status(404).json({ error: 'Авто не знайдено' });
    res.json({ message: 'Автомобіль видалено!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Сервер працює на порті ${PORT}`));
