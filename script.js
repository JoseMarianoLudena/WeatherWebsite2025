const API_KEY = "2885ffebe59b135e95c1e8896a12881b";  // Replace with your OpenWeather API key

async function getWeather() {
    const city = document.getElementById("cityInput").value;
    if (!city) return alert("Please enter a city!");

    try {
        // 🌤 Fetch Current Weather
        const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        const weatherData = await weatherRes.json();

        if (weatherData.cod !== 200) {
            alert(weatherData.message);
            return;
        }

        // 🌍 Update Weather Info
        document.getElementById("cityName").textContent = weatherData.name;
        document.getElementById("temperature").textContent = `${Math.round(weatherData.main.temp)}°C`;
        document.getElementById("description").textContent = weatherData.weather[0].description;
        document.getElementById("extraInfo").innerHTML = `
            💨 Wind: ${weatherData.wind.speed} m/s <br>
            💧 Humidity: ${weatherData.main.humidity}%
        `;

        // 🌤 Set Weather Icon
        const iconCode = weatherData.weather[0].icon;
        document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        // 🌱 Fetch Air Quality Data
        getAirQuality(weatherData.coord.lat, weatherData.coord.lon);
        
        // 📅 Fetch 7-Day Forecast
        getForecast(weatherData.coord.lat, weatherData.coord.lon);
        
    } catch (error) {
        console.error("Error fetching weather:", error);
    }
}

// 🌍 **Fetch Air Quality Data**
async function getAirQuality(lat, lon) {
    try {
        const airRes = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );
        const airData = await airRes.json();

        if (airData.list && airData.list.length > 0) {
            const aqi = airData.list[0].main.aqi;  // Air Quality Index (1-5 scale)
            const aqiText = ["Good 🌱", "Fair 🌤", "Moderate 😷", "Poor 😵", "Very Poor ☠"];
            document.getElementById("airQuality").textContent = `🌍 Air Quality: ${aqiText[aqi - 1]}`;
        }
    } catch (error) {
        console.error("Error fetching air quality:", error);
        document.getElementById("airQuality").textContent = "🌍 Air Quality: N/A";
    }
}

// 📅 **Fetch 7-Day Forecast**
async function getForecast(lat, lon) {
    try {
        const forecastRes = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        const forecastData = await forecastRes.json();

        const forecastContainer = document.getElementById("weeklyForecast");
        forecastContainer.innerHTML = "";

        // 📅 Filter forecast for each day (every 24 hours)
        const dailyForecast = {};
        forecastData.list.forEach((item) => {
            const date = new Date(item.dt * 1000).toLocaleDateString("en-US", { weekday: "short" });
            if (!dailyForecast[date]) {
                dailyForecast[date] = item;
            }
        });

        // 📊 Update Weekly Forecast UI
        Object.keys(dailyForecast).slice(0, 7).forEach((day) => {
            const temp = Math.round(dailyForecast[day].main.temp);
            const icon = dailyForecast[day].weather[0].icon;

            forecastContainer.innerHTML += `
                <div class="forecast-card">
                    <p>${day}</p>
                    <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Weather icon">
                    <p>${temp}°C</p>
                </div>
            `;
        });

        // 📈 Update Chart
        updateChart(Object.keys(dailyForecast).slice(0, 7), Object.values(dailyForecast).map(day => day.main.temp));

    } catch (error) {
        console.error("Error fetching forecast:", error);
    }
}

// 📈 **Update Weather Chart**
function updateChart(labels, data) {
    const ctx = document.getElementById("weatherChart").getContext("2d");

    if (window.myChart) {
        window.myChart.destroy();
    }

    window.myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Temperature (°C)",
                data: data,
                borderColor: "#ffcc00",
                backgroundColor: "rgba(255, 204, 0, 0.2)",
                borderWidth: 2,
                pointBackgroundColor: "#ffcc00",
                pointRadius: 5,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: "white"
                    }
                },
                x: {
                    ticks: {
                        color: "white"
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: "white"
                    }
                }
            }
        }
    });
}

let isCelsius = true;

function toggleTemperature() {
    const toggleBtn = document.getElementById("toggleTemp");

    // Toggle main temperature
    let tempElement = document.getElementById("temperature");
    let tempValue = parseFloat(tempElement.textContent);

    if (!isNaN(tempValue)) {
        tempElement.textContent = isCelsius 
            ? `${Math.round((tempValue * 9/5) + 32)}°F`
            : `${Math.round((tempValue - 32) * 5/9)}°C`;
    }

    // Toggle forecast temperatures
    document.querySelectorAll(".forecast-card p:last-child").forEach(temp => {
        let value = parseFloat(temp.textContent);
        if (!isNaN(value)) {
            temp.textContent = isCelsius 
                ? `${Math.round((value * 9/5) + 32)}°F` 
                : `${Math.round((value - 32) * 5/9)}°C`;
        }
    });

    // Toggle chart temperatures
    if (window.myChart) {
        window.myChart.data.datasets[0].data = window.myChart.data.datasets[0].data.map(temp => 
            isCelsius ? (temp * 9/5) + 32 : (temp - 32) * 5/9
        );
        window.myChart.data.datasets[0].label = isCelsius ? "Temperature (°F)" : "Temperature (°C)";
        window.myChart.update();
    }

    // Toggle visual button effect
    toggleBtn.classList.toggle("active");

    // Flip the state
    isCelsius = !isCelsius;
}


function toggleTheme() {
    const themeBtn = document.getElementById("toggleTheme");
    document.body.classList.toggle("dark-mode");

    // Toggle button visual
    let spans = themeBtn.getElementsByTagName("span");

    themeBtn.classList.toggle("active");
}