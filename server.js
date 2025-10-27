const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Підключення до БД - Render налаштує автоматично
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cars_db',
  port: process.env.DB_PORT || 5432  // PostgreSQL порт
});

db.connect((err) => {
  if (err) {
    console.log('❌ Помилка підключення до БД:', err.message);
    console.log('⚠️  Додаток працюватиме без бази даних');
  } else {
    console.log('✅ Підключено до бази даних!');
  }
});

// Статичні файли
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API тест
app.get('/api', (req, res) => {
  res.json({ message: '🚗 Car API працює!' });
});

// Отримати всі автомобілі
app.get('/api/cars', (req, res) => {
  const sql = 'SELECT * FROM cars';
  db.query(sql, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

// Отримати один автомобіль по ID
app.get('/api/cars/:id', (req, res) => {
  const carId = req.params.id;
  const sql = 'SELECT * FROM cars WHERE id = ?';
  
  db.query(sql, [carId], (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Автомобіль не знайдено' });
    }
    res.json(results[0]);
  });
});

// Додати новий автомобіль
app.post('/api/cars', (req, res) => {
  const { brand, model, year, price, registrationDate, mileage, fuelType } = req.body;
  
  if (!brand || !model || !year || !mileage || !fuelType) {
    return res.status(400).json({ error: 'Марка, модель, рік, пробіг та тип палива обовʼязкові' });
  }

  const sql = 'INSERT INTO cars (brand, model, year, price, registrationDate, mileage, fuelType) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [brand, model, year, price, registrationDate, mileage, fuelType], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Автомобіль додано успішно!',
      car: { id: result.insertId, brand, model, year, price, registrationDate, mileage, fuelType }
    });
  });
});

// Оновити автомобіль
app.put('/api/cars/:id', (req, res) => {
  const carId = req.params.id;
  const { brand, model, year, price, registrationDate, mileage, fuelType } = req.body;

  const sql = 'UPDATE cars SET brand=?, model=?, year=?, price=?, registrationDate=?, mileage=?, fuelType=? WHERE id=?';
  
  db.query(sql, [brand, model, year, price, registrationDate, mileage, fuelType, carId], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Автомобіль не знайдено' });
    }
    res.json({ message: 'Автомобіль оновлено успішно!' });
  });
});

// Видалити автомобіль
app.delete('/api/cars/:id', (req, res) => {
  const carId = req.params.id;
  const sql = 'DELETE FROM cars WHERE id=?';
  
  db.query(sql, [carId], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Автомобіль не знайдено' });
    }
    res.json({ message: 'Автомобіль видалено успішно!' });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер працює на порті ${PORT}`);
});
