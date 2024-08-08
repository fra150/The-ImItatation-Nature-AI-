![The Imitatation Nature AI in Action](assets/fire_prevention.gif)

# The Imitatation Nature AI: Fire Protection for Our Forests

A future where forest fires are stopped in their tracks.

Imagine a world where the devastation of forest fires is just a distant memory. The Imitatation Nature AI turns this dream into reality, thanks to a revolutionary prevention system powered by artificial intelligence.

## Table of Contents

1. [The Problem: A Growing Global Threat](#the-problem-a-growing-global-threat)
2. [Our Solution](#our-solution)
3. [How It Works](#how-it-works)
4. [Demo Execution Instructions](#demo-execution-instructions)
5. [Limitations](#limitations)
6. [Future Vision](#future-vision)
7. [Contacts](#contacts)
8. [License](#license)
9. [Acknowledgments](#acknowledgments)

## The Problem: A Growing Global Threat

Forest fires pose an increasingly severe threat to our planet. They cause irreparable environmental damage, endanger human and animal lives, and release massive amounts of CO2 into the atmosphere. Traditional solutions often intervene too late.

## Our Solution

The Imitatation Nature AI (inspired by Alan Turing) is a revolutionary system that harnesses the power of artificial intelligence to predict and prevent forest fires, protecting the environment and saving lives. Unlike traditional systems that only react after a fire has broken out, The Imitatation Nature AI focuses on prevention, acting before the fire becomes uncontrollable and stopping it in its tracks.

## How It Works

The Imitatation Nature AI operates in three main phases:

### 1. Predictive Analysis with Google Gemini 1.5 Pro

The heart of the system is Google Gemini 1.5 Pro, an advanced artificial intelligence that analyzes data from:

- **IoT sensors**: Deployed in forested areas, they monitor temperature, humidity, smoke, gas, LIDAR, movement, light, proximity, vibration, position, biometric data, level, seismic, magnetic, and wind speed.
- **Satellite images**: Provide a global and real-time view of the terrain conditions using Google Earth Engine.
- **Weather models**: Process data to predict conditions favorable to fires.
- **Historical databases**: Use information from past fires to improve predictions.

The AI employs machine learning algorithms, including:

- Deep reinforcement learning
- Supervised and unsupervised learning
- Graph Neural Networks (GNN)

These algorithms enable:

- Precisely identifying areas at risk of fire
- Predicting the evolution of a potential fire
- Planning timely interventions

### 2. Monitoring and Alert with Autonomous Drones

Autonomous drones, such as those produced by Skydio or similar, serve as the guardians of our forests:

- They patrol extensive forested areas autonomously, guided by AI.
- Equipped with high-resolution thermal and optical sensors.
- Detect fire signs promptly.
- Controlled by Google AI to optimize flight routes and process large amounts of data using machine learning algorithms.

### 3. Rapid and Coordinated Intervention

In case of fire sign detection:

- Drones intervene immediately, releasing targeted fire-suppressing agents.
- The system sends a detailed notification to firefighters, both written and vocal, including:
  - Precise location
  - Thermal images
  - Analysis of the potential spread of the fire

This approach allows for containing the fire at its earliest stages, minimizing damage and protecting the environment.

## Demo Execution Instructions

The Imitatation Nature AI demo provides an insight into the system's operation, using simulated data and limited functionality.

### Prerequisites:

- Node.js
- TensorFlow
- Access to Google Earth data
- Access to MQTT sensors
- Access to a vector database
- Access to a cloud (in this case, Google Cloud)
- Your own JWT key
- A database (in this case, Mysql2)
- A drone (with a 'Fireball' fire-suppressing agent)

### Installation:

1. Clone the repository:

   ```bash
   git clone [https://github.com/fra150/The-ImItatation-Nature-AI-.git]
   cd theimitatationnatureai
   ```

2. Install dependencies:

   ```bash
   cd TheImitatationNatureAI
   npm install
   ```

3. Configuration:
   Create a `.env` file in the project root with the following variables:

   ```
   DB_HOST=localhost
   PORT=[server_port]
   DB_PORT=[database_port]
   DB_NAME=[database_name]
   DB_USER=[database_user]
   DB_DRIVER=mysql
   DB_PASS=[database_password]
   JWT_SECRET=[jwt_secret]
   GOOGLE_MAPS_API_KEY=[google_maps_api_key]
   GEMINI_API_KEY=[gemini_api_key]
   EMAIL_USER=[google_account_email]
   EMAIL_PASS=[email_password]
   MQTT_BROKER_URL=mqtt://[mqtt_broker_address]
   NOTIFICATION_EMAIL_RECIPIENT=[notification_email_recipient]
   NOTIFICATION_EMAIL_SUBJECT=Fire Event Notification
   MODEL_PATH=[model_path]
   SAVE_PATH=[save_path]
   EPOCHS=[max_epochs]
   GOOGLE_APPLICATION_CREDENTIALS=[path_to_google_credentials_file]
   ```

### Execution:

```bash
npm run dev
npm start
```

### Limitations

The current demo has some limitations:

- **Simulated data:** The data used in this demo is fictional and is solely intended to demonstrate the system's functionality. A real implementation would require integration with real data sources, such as IoT sensors, satellite images, and historical databases.
- **Limited functionality:** Some features, such as complete integration with firefighter systems, are not implemented in the demo.
- **Drone management:** Drone fleet management is currently simulated and would require integration with autonomous flight control systems.
- **Lack of tests:** Currently, there are no automated tests for the code.

In the future, it is planned to integrate with real-time data, a fleet of drones for large-scale intervention, and a complete test suite.

### Future Vision

The Imitatation Nature AI has the potential to revolutionize not only forest fire prevention but also other critical areas:

Smart cities: Imagine The Imitatation Nature AI applied to city management: the system could monitor air pollution levels, optimize traffic flow in real-time, and even identify areas at risk of flooding.

Ocean conservation: In the oceans, it could contribute to mapping plastic islands, monitoring endangered marine species, and preventing oil spills.

### Contacts

150francescobulla@gmail.com - [link video](https://youtu.be/lezQ6c0ONto)

### License

[Apache License 2.0](LICENSE)

### Acknowledgments

A special thanks goes to [Google](https://about.google/)for the inspiration and innovative technologies that have made this project possible. Also, thanks to firefighters for their tireless work in protecting our communities.

If you're an artificial intelligence enthusiast, concerned about environmental sustainability, or just want to learn more about The Imitatation Nature AI, don't hesitate to contact me. I'm open to collaborations, suggestions, and new ideas to make this project a reality!
