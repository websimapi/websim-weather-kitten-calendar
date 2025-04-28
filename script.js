import confetti from 'canvas-confetti';

// Weather and LLM configuration
const OPENWEATHERMAP_API_KEY = 'YOUR_API_KEY'; // Replace with an actual API key
let currentWeather = 'clear';
let weatherDescription = 'sunny';
let temperature = 0;
let weatherKittensGenerated = false;

// Calendar state
let currentDate = new Date();
let selectedDate = new Date();

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    showLoadingOverlay(true);
    await getWeatherData();
    renderCalendar();
    await generateWeatherKittens();
    showLoadingOverlay(false);
    addKittenAnimations();
});

// Weather API functions
async function getWeatherData() {
    try {
        // Get user's location
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Fetch weather data
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`;
        
        // If we don't have an API key, use mock data
        if (OPENWEATHERMAP_API_KEY === 'YOUR_API_KEY') {
            useMockWeatherData();
            return;
        }
        
        const response = await fetch(weatherUrl);
        const data = await response.json();
        
        // Update weather state
        currentWeather = data.weather[0].main.toLowerCase();
        weatherDescription = data.weather[0].description.toLowerCase();
        temperature = Math.round(data.main.temp);
        
        // Update UI
        document.getElementById('location').textContent = data.name;
        document.getElementById('current-weather').textContent = data.weather[0].main;
        document.getElementById('temperature').textContent = `${temperature}°C`;
        
        // Update theme based on weather
        updateWeatherTheme();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        useMockWeatherData();
    }
}

function useMockWeatherData() {
    // Mock data in case we can't get real weather
    const weatherTypes = ['clear', 'rain', 'clouds', 'snow', 'thunderstorm'];
    const randomIndex = Math.floor(Math.random() * weatherTypes.length);
    currentWeather = weatherTypes[randomIndex];
    
    const weatherDescriptions = {
        'clear': 'sunny day',
        'rain': 'light rain',
        'clouds': 'partly cloudy',
        'snow': 'light snow',
        'thunderstorm': 'thunderstorm'
    };
    
    weatherDescription = weatherDescriptions[currentWeather];
    temperature = Math.floor(Math.random() * 30) - 5;
    
    document.getElementById('location').textContent = 'Sample Location';
    document.getElementById('current-weather').textContent = currentWeather.charAt(0).toUpperCase() + currentWeather.slice(1);
    document.getElementById('temperature').textContent = `${temperature}°C`;
    
    updateWeatherTheme();
}

function updateWeatherTheme() {
    // Remove all theme classes
    const container = document.querySelector('.container');
    container.classList.remove('sunny-theme', 'rainy-theme', 'cloudy-theme', 'snowy-theme', 'stormy-theme');
    
    // Add appropriate theme class
    if (currentWeather.includes('clear')) {
        container.classList.add('sunny-theme');
    } else if (currentWeather.includes('rain')) {
        container.classList.add('rainy-theme');
    } else if (currentWeather.includes('cloud')) {
        container.classList.add('cloudy-theme');
    } else if (currentWeather.includes('snow')) {
        container.classList.add('snowy-theme');
    } else if (currentWeather.includes('thunder') || currentWeather.includes('storm')) {
        container.classList.add('stormy-theme');
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

// Calendar rendering
function renderCalendar() {
    const monthYearElement = document.getElementById('month-year');
    const daysGridElement = document.getElementById('days-grid');
    
    // Update month and year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                         'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
    // Clear previous days
    daysGridElement.innerHTML = '';
    
    // Get first day of month and total days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Add days from previous month
    const firstDayIndex = firstDay.getDay();
    for (let i = firstDayIndex; i > 0; i--) {
        const prevMonthDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), -i + 1);
        const dayElement = createDayElement(prevMonthDay.getDate(), true);
        daysGridElement.appendChild(dayElement);
    }
    
    // Add days from current month
    const today = new Date();
    for (let i = 1; i <= lastDay.getDate(); i++) {
        const isToday = i === today.getDate() && 
                         currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();
        
        const dayElement = createDayElement(i, false, isToday);
        daysGridElement.appendChild(dayElement);
    }
    
    // Add days from next month
    const daysToAdd = 42 - (firstDayIndex + lastDay.getDate());
    for (let i = 1; i <= daysToAdd; i++) {
        const dayElement = createDayElement(i, true);
        daysGridElement.appendChild(dayElement);
    }
    
    // Add event listeners to navigation buttons
    document.getElementById('prev-month').addEventListener('click', goToPrevMonth);
    document.getElementById('next-month').addEventListener('click', goToNextMonth);
}

function createDayElement(dayNumber, isOtherMonth, isToday = false) {
    const dayElement = document.createElement('div');
    dayElement.className = 'day';
    if (isOtherMonth) dayElement.classList.add('other-month');
    if (isToday) dayElement.classList.add('today');
    
    dayElement.textContent = dayNumber;
    
    dayElement.addEventListener('click', () => {
        // Remove today class from all days
        document.querySelectorAll('.day').forEach(day => day.classList.remove('selected'));
        
        // Add selected class
        dayElement.classList.add('selected');
        
        // Show confetti for today or animated kittens
        if (isToday) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    });
    
    return dayElement;
}

function goToPrevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function goToNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// LLM Kitten Generation
async function generateWeatherKittens() {
    if (weatherKittensGenerated) return;
    
    const kittenContainer = document.getElementById('kitten-container');
    kittenContainer.innerHTML = '';
    
    try {
        // Generate a main weather kitten image
        const weatherPrompt = generateKittenPrompt();
        const kittenResult = await websim.imageGen({
            prompt: weatherPrompt,
            aspect_ratio: "1:1",
        });
        
        // Process the image to make white background transparent
        const mainKittenImg = document.createElement('img');
        mainKittenImg.src = kittenResult.url;
        mainKittenImg.alt = "Weather kitten";
        mainKittenImg.onload = () => makeBackgroundTransparent(mainKittenImg);
        
        // Add the main kitten to container
        kittenContainer.appendChild(mainKittenImg);
        
        // Update the kitten description
        document.getElementById('kitten-description').textContent = generateKittenDescription();
        
        // Mark as generated
        weatherKittensGenerated = true;
    } catch (error) {
        console.error('Error generating kittens:', error);
        document.getElementById('kitten-description').textContent = 
            "Our weather kittens are hiding today. Please try again later.";
    }
}

function generateKittenPrompt() {
    let basePrompt = "Cute tiny cartoon kitten with a white background";
    
    if (currentWeather.includes('clear') || currentWeather.includes('sun')) {
        return `${basePrompt}, playing happily in sunshine, wearing sunglasses`;
    } else if (currentWeather.includes('rain')) {
        return `${basePrompt}, huddled under a tiny umbrella with raindrops around`;
    } else if (currentWeather.includes('cloud')) {
        return `${basePrompt}, looking up at fluffy clouds with curious expression`;
    } else if (currentWeather.includes('snow')) {
        return `${basePrompt}, playing in snow, wearing a tiny scarf and hat`;
    } else if (currentWeather.includes('thunder') || currentWeather.includes('storm')) {
        return `${basePrompt}, hiding under a blanket looking scared with lightning in background`;
    } else if (temperature > 25) {
        return `${basePrompt}, looking hot, fanning itself with a tiny leaf`;
    } else if (temperature < 0) {
        return `${basePrompt}, shivering in cold weather wrapped in a cozy blanket`;
    } else {
        return `${basePrompt}, playing with a calendar, looking adorable`;
    }
}

function generateKittenDescription() {
    let weatherDescriptors = {
        'clear': "enjoying the beautiful sunny day",
        'sun': "basking in the warm sunshine",
        'rain': "staying dry under their tiny umbrella",
        'cloud': "watching the puffy clouds roll by",
        'snow': "playing in the fresh powder snow",
        'thunder': "hiding from the scary thunder",
        'storm': "waiting for the storm to pass"
    };
    
    let temperatureDescriptors = {
        hot: "trying to stay cool in the heat",
        warm: "enjoying the pleasant warmth",
        mild: "feeling comfortable in the mild weather",
        cool: "enjoying the refreshing cool air",
        cold: "bundled up against the chill"
    };
    
    let weatherPart = "";
    for (const [key, description] of Object.entries(weatherDescriptors)) {
        if (currentWeather.includes(key) || weatherDescription.includes(key)) {
            weatherPart = description;
            break;
        }
    }
    
    let tempPart = "";
    if (temperature > 30) tempPart = temperatureDescriptors.hot;
    else if (temperature > 20) tempPart = temperatureDescriptors.warm;
    else if (temperature > 10) tempPart = temperatureDescriptors.mild;
    else if (temperature > 0) tempPart = temperatureDescriptors.cool;
    else tempPart = temperatureDescriptors.cold;
    
    return `Today's weather kittens are ${weatherPart || "playing around"} and ${tempPart || "having fun"}. The temperature is ${temperature}°C with ${weatherDescription}.`;
}

function makeBackgroundTransparent(img) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the image on canvas
    ctx.drawImage(img, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Loop through the pixels
    for (let i = 0; i < data.length; i += 4) {
        // If pixel is white or close to white, make it transparent
        if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
            data[i + 3] = 0; // Set alpha to 0
        }
    }
    
    // Put the modified data back on the canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Update the image source
    img.src = canvas.toDataURL('image/png');
}

function addKittenAnimations() {
    // Add a few smaller animated kittens based on weather
    const kittenCount = 5;
    const kittenContainer = document.getElementById('kitten-display');
    
    for (let i = 0; i < kittenCount; i++) {
        setTimeout(() => {
            generateSmallKitten(kittenContainer, i);
        }, i * 1000);
    }
}

async function generateSmallKitten(container, index) {
    try {
        // Get a weather-appropriate prompt for a small kitten
        const weatherAction = getWeatherAction();
        const prompt = `Simple tiny kitten ${weatherAction} with white background, cartoon style`;
        
        // Generate kitten image
        const kittenResult = await websim.imageGen({
            prompt: prompt,
            aspect_ratio: "1:1",
            width: 150,
            height: 150,
        });
        
        // Create kitten element
        const kittenElement = document.createElement('img');
        kittenElement.src = kittenResult.url;
        kittenElement.alt = "Tiny kitten";
        kittenElement.className = 'kitten-thumbnail';
        kittenElement.style.width = '50px';
        kittenElement.style.height = '50px';
        
        // Position randomly
        const maxX = container.clientWidth - 60;
        const maxY = container.clientHeight - 60;
        const xPos = Math.random() * maxX;
        const yPos = Math.random() * maxY;
        
        kittenElement.style.left = `${xPos}px`;
        kittenElement.style.top = `${yPos}px`;
        
        // Add to container
        container.appendChild(kittenElement);
        
        // Make background transparent on load
        kittenElement.onload = () => {
            makeBackgroundTransparent(kittenElement);
            animateKitten(kittenElement, container);
        };
    } catch (error) {
        console.error('Error generating small kitten:', error);
    }
}

function getWeatherAction() {
    if (currentWeather.includes('clear') || currentWeather.includes('sun')) {
        const actions = ['playing with sunbeams', 'wearing tiny sunglasses', 'relaxing in sunshine'];
        return actions[Math.floor(Math.random() * actions.length)];
    } else if (currentWeather.includes('rain')) {
        const actions = ['with tiny umbrella', 'jumping in puddle', 'wearing raincoat'];
        return actions[Math.floor(Math.random() * actions.length)];
    } else if (currentWeather.includes('cloud')) {
        const actions = ['looking at clouds', 'with fluffy cloud pillow', 'daydreaming'];
        return actions[Math.floor(Math.random() * actions.length)];
    } else if (currentWeather.includes('snow')) {
        const actions = ['playing with snowball', 'wearing tiny winter hat', 'making snow angel'];
        return actions[Math.floor(Math.random() * actions.length)];
    } else if (currentWeather.includes('thunder') || currentWeather.includes('storm')) {
        const actions = ['hiding under blanket', 'scared of thunder', 'with lightning in background'];
        return actions[Math.floor(Math.random() * actions.length)];
    } else {
        const actions = ['playing with yarn', 'with butterfly', 'looking curious', 'with flower'];
        return actions[Math.floor(Math.random() * actions.length)];
    }
}

function animateKitten(kittenElement, container) {
    // Create animation for the kitten
    const maxX = container.clientWidth - 60;
    const maxY = container.clientHeight - 60;
    
    setInterval(() => {
        // Random new position
        const newX = Math.random() * maxX;
        const newY = Math.random() * maxY;
        
        // Animate to new position
        kittenElement.style.transition = 'all 3s ease';
        kittenElement.style.left = `${newX}px`;
        kittenElement.style.top = `${newY}px`;
    }, 5000);
}

function showLoadingOverlay(show) {
    const overlay = document.getElementById('loading-overlay');
    if (show) {
        overlay.style.display = 'flex';
    } else {
        overlay.style.display = 'none';
    }
}

