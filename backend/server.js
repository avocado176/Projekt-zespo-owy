const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Połączenie z bazą danych
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cars_db'
});

db.connect((err) => {
  if (err) {
    console.log('Błąd połączenia z bazą danych:', err);
    return;
  }
  console.log('✅ Połączono z MySQL!');
});

// Trasa testowa
app.get('/', (req, res) => {
  res.json({ message: '🚗 Car API działa!' });
});

// Pobierz wszystkie samochody
app.get('/cars', (req, res) => {
  const sql = 'SELECT * FROM cars';
  db.query(sql, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.listen(3000, () => {
  console.log('🚀 Serwer działa na http://localhost:3000');
});

// Dodaj nowy samochód - POST
app.post('/cars', (req, res) => {
  const { brand, model, year, price, registrationDate, mileage, fuelType } = req.body;
  
  // Walidacja (zgodnie z wymaganiami walidacji)
  if (!brand || !model || !year || !mileage || !fuelType) {
    return res.status(400).json({ error: 'Marka, model, rok, przebieg i typ paliwa są wymagane' });
  }

  const sql = 'INSERT INTO cars (brand, model, year, price, registrationDate, mileage, fuelType) VALUES (?, ?, ?, ?, ?, ?, ?)';
  
  db.query(sql, [brand, model, year, price, registrationDate, mileage, fuelType], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.status(201).json({ 
      id: result.insertId, 
      message: 'Samochód dodano pomyślnie!',
      car: { id: result.insertId, brand, model, year, price, registrationDate, mileage, fuelType }
    });
  });
});

// Zaktualizuj samochód - PUT
app.put('/cars/:id', (req, res) => {
  const carId = req.params.id;
  const { brand, model, year, price, registrationDate, mileage, fuelType } = req.body;

  const sql = 'UPDATE cars SET brand=?, model=?, year=?, price=?, registrationDate=?, mileage=?, fuelType=? WHERE id=?';
  
  db.query(sql, [brand, model, year, price, registrationDate, mileage, fuelType, carId], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Samochód nie znaleziony' });
    }
    res.json({ message: 'Samochód zaktualizowano pomyślnie!' });
  });
});

// Usuń samochód - DELETE
app.delete('/cars/:id', (req, res) => {
  const carId = req.params.id;
  const sql = 'DELETE FROM cars WHERE id=?';
  
  db.query(sql, [carId], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Samochód nie znaleziony' });
    }
    res.json({ message: 'Samochód usunięto pomyślnie!' });
  });
});
