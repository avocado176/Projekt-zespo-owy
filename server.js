const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // ← ДОДАЙ ЦЕ

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Підключення до БД з перепідключенням
let db;

function connectToDatabase() {
  db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cars_db',
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false }, // ← ДОДАЙ ЦЕ
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000
  });

  db.connect((err) => {
    if (err) {
      console.log('❌ Помилка підключення до БД:', err.message);
      console.log('🔄 Спробую ще раз через 5 секунд...');
      setTimeout(connectToDatabase, 5000);
    } else {
      console.log('✅ Підключено до бази даних!');
    }
  });

  db.on('error', (err) => {
    console.log('❌ Помилка БД:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('🔄 Втрачено зʼєднання, перепідключаюсь...');
      connectToDatabase();
    }
  });

  return db;
}

// Функція для безпечного виконання запитів
function executeQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    // Перевіряємо чи з'єднання активне
    if (!db || db.state === 'disconnected') {
      console.log('🔄 Зʼєднання розʼєднано, перепідключаюсь...');
      connectToDatabase();
    }

    db.query(sql, params, (err, results) => {
      if (err) {
        console.log('❌ Помилка запиту:', err.message);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// Ініціалізуємо підключення
connectToDatabase();

// Статичні файли
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API тест
app.get('/api', (req, res) => {
  res.json({ message: '🚗 Car API працює!' });
});

// Отримати всі автомобілі
app.get('/api/cars', async (req, res) => {
  try {
    const results = await executeQuery('SELECT * FROM cars');
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Отримати один автомобіль по ID
app.get('/api/cars/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    const results = await executeQuery('SELECT * FROM cars WHERE id = ?', [carId]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Автомобіль не знайдено' });
    }
    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Додати новий автомобіль
app.post('/api/cars', async (req, res) => {
  try {
    const { brand, model, year, price, registrationDate, mileage, fuelType } = req.body;
    
    if (!brand || !model || !year || !mileage || !fuelType) {
      return res.status(400).json({ error: 'Марка, модель, рік, пробіг та тип палива обовʼязкові' });
    }

    const result = await executeQuery(
      'INSERT INTO cars (brand, model, year, price, registrationDate, mileage, fuelType) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [brand, model, year, price, registrationDate, mileage, fuelType]
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Автомобіль додано успішно!',
      car: { id: result.insertId, brand, model, year, price, registrationDate, mileage, fuelType }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Оновити автомобіль
app.put('/api/cars/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    const { brand, model, year, price, registrationDate, mileage, fuelType } = req.body;

    const result = await executeQuery(
      'UPDATE cars SET brand=?, model=?, year=?, price=?, registrationDate=?, mileage=?, fuelType=? WHERE id=?',
      [brand, model, year, price, registrationDate, mileage, fuelType, carId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Автомобіль не знайдено' });
    }
    res.json({ message: 'Автомобіль оновлено успішно!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Видалити автомобіль
app.delete('/api/cars/:id', async (req, res) => {
  try {
    const carId = req.params.id;
    const result = await executeQuery('DELETE FROM cars WHERE id=?', [carId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Автомобіль не знайдено' });
    }
    res.json({ message: 'Автомобіль видалено успішно!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер працює на порті ${PORT}`);
});
