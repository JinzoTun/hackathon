from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    RunContext,
    WorkerOptions,
    RoomOutputOptions,
    RoomInputOptions,
    cli,
    function_tool,
)
from livekit.plugins import groq, silero

from dotenv import load_dotenv
import json 
import requests
import logging
import datetime

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.DEBUG)

load_dotenv(dotenv_path=".env.local")

@function_tool
async def lookup_weather(
    context: RunContext,
    location: str,
):
    """Used to look up weather information for agricultural planning."""
 
    #  returning mock data for demonstration
    weather_data = {
        "weather": "sunny", 
        "temperature": 70, 
        "humidity": "65%",
        "precipitation_chance": "10%",
        "wind_speed": "8 mph"
    }
    return weather_data

@function_tool
async def get_crop_recommendations(
    context: RunContext,
    soil_type: str,
    region: str = "",
    season: str = "",
):
    """Recommends suitable crops based on soil type, region, and current season."""
    # Mock database of crop recommendations
    recommendations = {
        "clay": ["wheat", "rice", "cabbage", "broccoli"],
        "sandy": ["carrots", "potatoes", "peanuts", "watermelon"],
        "loam": ["corn", "soybeans", "tomatoes", "peppers"],
        "silt": ["lettuce", "spinach", "chard", "strawberries"],
        "peat": ["blueberries", "cranberries", "mint"]
    }
    
    # Default to loam if soil type not recognized
    soil_type = soil_type.lower()
    if soil_type not in recommendations:
        soil_type = "loam"
        
    suitable_crops = recommendations[soil_type]
    return {
        "soil_type": soil_type,
        "recommended_crops": suitable_crops,
        "planting_season": season if season else "current",
        "region": region if region else "general recommendations"
    }

@function_tool
async def identify_plant_disease(
    context: RunContext,
    symptoms: str,
    crop_type: str,
):
    """Identifies potential plant diseases based on symptoms and crop type."""
    # Mock disease identification database
    disease_database = {
        "tomato": {
            "yellow leaves": "Nitrogen deficiency or early blight",
            "black spots": "Late blight",
            "wilting": "Fusarium wilt or bacterial wilt",
            "curling leaves": "Tomato yellow leaf curl virus"
        },
        "corn": {
            "grey lesions": "Gray leaf spot",
            "rust colored spots": "Common rust",
            "stunted growth": "Nitrogen deficiency",
            "whitish growth": "Downy mildew"
        },
        "wheat": {
            "yellow pustules": "Stripe rust",
            "brown lesions": "Septoria leaf blotch",
            "black spots": "Black point or smut",
            "wilting": "Take-all disease"
        }
    }
    
    crop_type = crop_type.lower()
    # Default response 
    if crop_type not in disease_database:
        return {
            "diagnosis": "Unknown crop type. Please provide more details or contact a local agricultural extension.",
            "recommendations": "Consider sending a sample to a plant pathology lab for accurate diagnosis."
        }
    
    # Look for symptom matches
    diagnosis = "Unknown disease. Please provide more symptom details."
    for key_symptom, disease in disease_database[crop_type].items():
        if key_symptom.lower() in symptoms.lower():
            diagnosis = disease
            break
    
    treatment = "Consult with a local agricultural extension for specific treatment recommendations."
    
    return {
        "crop": crop_type,
        "symptoms": symptoms,
        "diagnosis": diagnosis,
        "treatment_recommendations": treatment
    }

@function_tool
async def get_farming_calendar(
    context: RunContext,
    crop_type: str,
    region: str = "",
):
    """Provides a seasonal calendar for planting, maintenance, and harvesting of specific crops."""
    # Mock farming calendar data
    current_month = datetime.datetime.now().month
    seasons = {
        "winter": [12, 1, 2],
        "spring": [3, 4, 5],
        "summer": [6, 7, 8],
        "fall": [9, 10, 11]
    }
    
    # Determine current season
    current_season = "unknown"
    for season, months in seasons.items():
        if current_month in months:
            current_season = season
            break
    
    crop_calendars = {
        "tomato": {
            "planting_time": "spring (after last frost)",
            "maintenance": "regular watering, pruning, staking",
            "harvest_time": "60-80 days after planting, summer to fall",
            "current_tasks": {
                "spring": "prepare soil, plant seedlings when soil is warm",
                "summer": "regular watering, pruning, watch for diseases",
                "fall": "final harvests, remove plants at season end",
                "winter": "plan for next season, order seeds"
            }
        },
        "corn": {
            "planting_time": "late spring when soil is warm",
            "maintenance": "consistent watering, fertilizing when knee-high",
            "harvest_time": "80-100 days after planting, summer to fall",
            "current_tasks": {
                "spring": "prepare soil, plant after last frost when soil is warm",
                "summer": "side-dress with nitrogen, ensure consistent moisture",
                "fall": "harvest when kernels are plump, remove stalks",
                "winter": "soil preparation for next season"
            }
        },
        "wheat": {
            "planting_time": "fall for winter wheat, spring for spring wheat",
            "maintenance": "weed control, possible irrigation",
            "harvest_time": "summer for winter wheat, late summer for spring wheat",
            "current_tasks": {
                "spring": "plant spring wheat, monitor winter wheat growth",
                "summer": "harvest winter wheat, prepare for storage",
                "fall": "plant winter wheat, soil preparation",
                "winter": "monitor winter wheat dormancy"
            }
        }
    }
    
    crop_type = crop_type.lower()
    # Default response if crop not in database
    if crop_type not in crop_calendars:
        return {
            "crop": crop_type,
            "note": "Specific calendar not available for this crop. Contact your local agricultural extension for guidance.",
            "general_advice": "Follow seasonal planting guides appropriate for your local climate."
        }
    
    calendar = crop_calendars[crop_type]
    current_task = calendar["current_tasks"].get(current_season, "Plan for the upcoming growing season")
    
    return {
        "crop": crop_type,
        "planting_time": calendar["planting_time"],
        "maintenance": calendar["maintenance"],
        "harvest_time": calendar["harvest_time"],
        "current_season": current_season,
        "current_task": current_task,
        "region": region if region else "general recommendations"
    }

@function_tool
async def get_sustainable_practices(
    context: RunContext,
    farming_type: str,
    challenge: str = "",
):
    """Provides sustainable farming practices and solutions to common challenges."""
    sustainable_practices = {
        "conventional": [
            "Implement crop rotation to break pest cycles",
            "Use cover crops to prevent erosion and add nutrients",
            "Practice integrated pest management to reduce chemical use",
            "Install buffer zones around water sources",
            "Use precision agriculture for targeted application of inputs"
        ],
        "organic": [
            "Use compost and natural amendments for soil fertility",
            "Introduce beneficial insects for pest control",
            "Practice polyculture and companion planting",
            "Use mulch for weed suppression and moisture retention",
            "Rotate grazing for pasture management"
        ],
        "hydroponics": [
            "Recirculate and filter water to minimize waste",
            "Use LED lighting for energy efficiency",
            "Monitor nutrient levels closely to prevent runoff",
            "Consider aquaponics to create a closed system",
            "Use renewable energy sources to power systems"
        ]
    }
    
    # Common farming challenges and solutions
    challenge_solutions = {
        "water conservation": [
            "Install drip irrigation systems",
            "Collect rainwater for irrigation",
            "Use soil moisture sensors to optimize watering",
            "Apply mulch to reduce evaporation",
            "Select drought-resistant crop varieties"
        ],
        "soil erosion": [
            "Plant cover crops during off-seasons",
            "Implement contour farming on sloped land",
            "Create windbreaks with trees or shrubs",
            "Use no-till or minimum tillage practices",
            "Establish grassed waterways in high-flow areas"
        ],
        "pest management": [
            "Encourage biodiversity to support beneficial insects",
            "Use trap crops to divert pests from main crops",
            "Implement crop rotation to disrupt pest cycles",
            "Consider row covers for physical protection",
            "Release beneficial insects like ladybugs or predatory mites"
        ]
    }
    
    farming_type = farming_type.lower()
    # Default to conventional if farming type not recognized
    if farming_type not in sustainable_practices:
        farming_type = "conventional"
    
    results = {
        "farming_type": farming_type,
        "sustainable_practices": sustainable_practices[farming_type],
    }
    
    # Add challenge-specific solutions if provided
    if challenge and challenge.lower() in challenge_solutions:
        results["challenge"] = challenge
        results["specific_solutions"] = challenge_solutions[challenge.lower()]
    
    return results

async def entrypoint(ctx: JobContext):
    await ctx.connect()

    agent = Agent(
        instructions="""
            You are AgriLink Assistant, a specialized agricultural advisor for farmers.
            
            YOUR ROLE:
            - Provide helpful farming advice, crop recommendations, and agricultural best practices
            - Assist with identifying plant diseases based on described symptoms
            - Offer sustainable farming techniques tailored to specific challenges
            - Help farmers plan their seasonal activities with farming calendars
            - Provide localized weather information relevant to agricultural activities
            
            GUIDELINES:
            - Always respond in the SAME LANGUAGE as the user's prompt (e.g., if user speaks Arabic, respond in Arabic)
            - Use friendly, conversational tone without being rude
            - Keep small talk brief but warm
            - Provide practical information without lengthy explanations
            - Acknowledge regional differences in farming techniques with minimal words
            
            TOOLS USAGE:
            - Use the `lookup_weather` tool when users ask about weather conditions for farming activities
            - Use the `get_crop_recommendations` tool to suggest suitable crops based on soil type and region
            - Use the `identify_plant_disease` tool when farmers describe crop symptoms
            - Use the `get_farming_calendar` tool to help farmers with seasonal planning
            - Use the `get_sustainable_practices` tool to provide sustainability advice
            
            REMEMBER: Always start with Greeting and keep responses usefull and don't over talk.
            """,
        tools=[lookup_weather, get_crop_recommendations, identify_plant_disease, get_farming_calendar, get_sustainable_practices],
    )
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=groq.STT(),  
        llm=groq.LLM(model="meta-llama/llama-4-scout-17b-16e-instruct"),
        tts=groq.TTS(model="playai-tts"), 
    )

    logger.debug("RoomOutputOptions configured with audio_enabled=False")
    logger.debug("Starting session with audio output disabled.")

    try:
        await session.start(
            agent=agent,
            room=ctx.room,
            room_input_options=RoomInputOptions(text_enabled=True),
            room_output_options=RoomOutputOptions(audio_enabled=False)
        )
        logger.debug("Session started successfully with audio disabled.")
    except Exception as e:
        logger.error("Error starting session: %s", e)
        raise

    logger.debug("Session setup complete. Listening for text input...")

if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))