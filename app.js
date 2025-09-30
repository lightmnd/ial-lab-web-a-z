const searchBtn = document.getElementById("submitBtn");
const cityField = document.getElementById("cityField");
const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const condition = document.getElementById("condition");
const windSpeed = document.getElementById("windSpeed");
const errorMessage = document.getElementById("errorMessage");
const loading = document.getElementById("loading");
const resultContainer = document.getElementById("resultContainer");
const weatherIcon = document.getElementById("weatherIcon");

const apiUrl = "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true";

function showLoading(param) {
    console.log(param)
    loading.classList.remove("hidden");
    resultContainer.classList.add("hidden");
    errorMessage.textContent = "";
}

function hideLoading() {
    loading.classList.add("hidden");
}

function showResults() {
    resultContainer.classList.remove("hidden");
}

function getWeatherIcon(code) {
    // Weather codes from Open-Meteo API
    const weatherIcons = {
        0: 'fa-sun', // Clear sky
        1: 'fa-cloud-sun', // Mainly clear
        2: 'fa-cloud-sun', // Partly cloudy
        3: 'fa-cloud', // Overcast
        45: 'fa-smog', // Foggy
        48: 'fa-smog', // Depositing rime fog
        51: 'fa-cloud-rain', // Light drizzle
        53: 'fa-cloud-rain', // Moderate drizzle
        55: 'fa-cloud-rain', // Dense drizzle
        61: 'fa-cloud-rain', // Slight rain
        63: 'fa-cloud-rain', // Moderate rain
        65: 'fa-cloud-showers-heavy', // Heavy rain
        71: 'fa-snowflake', // Slight snow fall
        73: 'fa-snowflake', // Moderate snow fall
        75: 'fa-snowflake', // Heavy snow fall
        77: 'fa-snowflake', // Snow grains
        80: 'fa-cloud-rain', // Slight rain showers
        81: 'fa-cloud-showers-heavy', // Moderate rain showers
        82: 'fa-cloud-showers-heavy', // Violent rain showers
        95: 'fa-cloud-bolt', // Thunderstorm
        96: 'fa-cloud-bolt', // Thunderstorm with slight hail
        99: 'fa-cloud-bolt', // Thunderstorm with heavy hail
    };

    return weatherIcons[code] || 'fa-question';
}

searchBtn.addEventListener("click", async () => {
    const city = cityField.value.trim();
    if (!city) {
        errorMessage.textContent = "Per favore, inserisci una città.";
        return;
    }

    showLoading('pippo');

    try {
        const response = await fetch(`https://geocode.xyz/${city}?json=1`);
        const data = await response.json();
        if (data.error) {
            errorMessage.textContent = "Città non trovata.";
            hideLoading();
            return;
        }

        const { latt, longt } = data;
        const weatherResponse = await fetch(apiUrl.replace("{lat}", latt).replace("{lon}", longt));
        const weatherData = await weatherResponse.json();

        if (!weatherData || !weatherData.current_weather) {
            errorMessage.textContent = "Impossibile ottenere i dati meteo.";
            hideLoading();
            return;
        }


        hideLoading();
        showResults();

        const weatherCode = weatherData.current_weather.weathercode;
        const iconClass = getWeatherIcon(weatherCode);

        cityName.textContent = `${city}`;
        weatherIcon.className = `weather-icon fas ${iconClass}`; // Set the icon
        temperature.textContent = `Temperatura: ${weatherData.current_weather.temperature}°C`;
        condition.textContent = `Condizione: ${weatherData.current_weather.weathercode}`;
        windSpeed.textContent = `Velocità del vento: ${weatherData.current_weather.windspeed} km/h`;
        errorMessage.textContent = "";
    } catch (error) {
        hideLoading();
        errorMessage.textContent = "Si è verificato un errore. Riprova più tardi.";
    }
});

