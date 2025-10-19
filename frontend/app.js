const API_URL = 'http://localhost:3000';

// Załaduj wszystkie samochody
async function loadCars() {
    try {
        const response = await fetch(`${API_URL}/cars`);
        const cars = await response.json();
        displayCars(cars);
    } catch (error) {
        console.error('Błąd ładowania:', error);
        showError('Nie udało się załadować listy samochodów');
    }
}

// Wyświetl samochody w interfejsie
function displayCars(cars) {
    const carsList = document.getElementById('carsList');
    
    if (cars.length === 0) {
        carsList.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Brak samochodów w bazie danych</p>';
        return;
    }

    carsList.innerHTML = cars.map(car => `
        <div class="car-card">
            <h3>${car.brand} ${car.model}</h3>
            <p><strong>Rok:</strong> ${car.year}</p>
            <p><strong>Cena:</strong> $${car.price || 'Nie podano'}</p>
            <p><strong>Rejestracja:</strong> ${car.registrationDate ? new Date(car.registrationDate).toLocaleDateString('pl-PL') : 'Nie podano'}</p>
            <p><strong>Przebieg:</strong> ${car.mileage}</p>
            <p><strong>Rodzaj paliwa:</strong> ${car.fuelType}</p>
            <p><strong>ID:</strong> ${car.id}</p>
            <button class="delete-btn" onclick="deleteCar(${car.id})">🗑️ Usuń</button>
        </div>
    `).join('');
}

// Dodaj nowy samochód
document.getElementById('carForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const carData = {
        brand: document.getElementById('brand').value.trim(),
        model: document.getElementById('model').value.trim(),
        year: parseInt(document.getElementById('year').value),
        price: document.getElementById('price').value ? parseFloat(document.getElementById('price').value) : null,
        registrationDate: document.getElementById('registrationDate').value || null,
        mileage: parseInt(document.getElementById('mileage').value),
        fuelType: document.getElementById('fuelType').value.trim()
    };

    // Walidacja
    if (!carData.brand || !carData.model || !carData.year || !carData.mileage || !carData.fuelType) {
        showError('Proszę wypełnić obowiązkowe pola: marka, model, rok, przebieg, typ paliwa');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cars`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(carData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Błąd serwera');
        }

        const result = await response.json();
        console.log('Samochód dodany:', result);
        
        // Wyczyść formularz
        e.target.reset();
        
        // Odśwież listę
        loadCars();
        
        showSuccess('Samochód pomyślnie dodany!');
        
    } catch (error) {
        console.error('Błąd dodawania:', error);
        showError('Błąd podczas dodawania samochodu: ' + error.message);
    }
});

// Usuń samochód
async function deleteCar(carId) {
    if (!confirm('Czy na pewno chcesz usunąć ten samochód?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cars/${carId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Błąd serwera');
        }

        const result = await response.json();
        console.log('Samochód usunięty:', result);
        
        // Odśwież listę
        loadCars();
        
        showSuccess('Samochód pomyślnie usunięty!');
        
    } catch (error) {
        console.error('Błąd usuwania:', error);
        showError('Błąd podczas usuwania samochodu: ' + error.message);
    }
}

// Funkcje dla komunikatów
function showError(message) {
    alert('❌ ' + message);
}

function showSuccess(message) {
    alert('✅ ' + message);
}

// Załaduj samochody przy starcie
document.addEventListener('DOMContentLoaded', function() {
    loadCars();
    console.log('Car Management System załadowany');
});

