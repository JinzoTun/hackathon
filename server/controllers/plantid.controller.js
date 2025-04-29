import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/user.model.js';
import DiseaseAlert from '../models/DiseaseAlert.js';
import cloudinary from '../config/cloudinary.js';
import { PLANT_ID_API_KEY } from '../config/env.js';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Analyze plant image for disease detection
 * @route POST /api/v1/plantid/analyze
 * @access Private
 */
export const analyzePlantDisease = async (req, res, next) => {
    try {
        // DEBUG: Log the user object to check if it's properly populated
        console.log("REQUEST USER:", JSON.stringify({
            id: req.user?._id,
            name: req.user?.name,
            exists: !!req.user
        }));

        // Verify if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload an image file'
            });
        }

        // Check if plant type was provided
        const { plantType } = req.body;
        if (!plantType) {
            return res.status(400).json({
                success: false,
                error: 'Plant type is required'
            });
        }

        // Get location coordinates
        const { longitude, latitude } = req.body;
        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                error: 'Location coordinates are required'
            });
        }

        console.log("Processing request with:", {
            plantType,
            coordinates: [longitude, latitude],
            fileName: req.file.originalname,
            fileSize: req.file.size
        });

        // Upload image to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'plant_diseases',
            resource_type: 'image'
        });
        console.log("Cloudinary upload successful:", uploadResult.secure_url);

        // Read file as base64 for Plant.id API v3
        const base64Image = fs.readFileSync(req.file.path, { encoding: 'base64' });

        // Prepare data for Plant.id API request using v3 endpoint format
        const plantIdData = {
            images: [base64Image],
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            health: 'only', // Focus on health assessment only
            similar_images: true // Get similar images for reference
        };

        console.log("Sending request to Plant.id API:", {
            url: 'https://plant.id/api/v3/health_assessment',
            key: PLANT_ID_API_KEY ? 'API key is set' : 'API key is missing',
            dataKeys: Object.keys(plantIdData)
        });

        // Call Plant.id API v3 for disease identification
        const apiResponse = await axios.post(
            'https://plant.id/api/v3/health_assessment',
            plantIdData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Api-Key': PLANT_ID_API_KEY
                }
            }
        );

        // Clean up temporary file
        fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temporary file:', err);
        });

        console.log("Plant.id API response status:", apiResponse.data.status);

        // DEBUG: Log the structure of the API response
        console.log("Response structure:", JSON.stringify({
            hasResult: !!apiResponse.data.result,
            hasDisease: !!(apiResponse.data.result && apiResponse.data.result.disease),
            hasSuggestions: !!(apiResponse.data.result &&
                apiResponse.data.result.disease &&
                apiResponse.data.result.disease.suggestions),
            suggestionsCount: apiResponse.data.result?.disease?.suggestions?.length || 0,
            isHealthy: apiResponse.data.result?.is_healthy?.binary,
        }));

        // Process API response based on v3 format
        const diseases = [];
        if (apiResponse.data &&
            apiResponse.data.result &&
            apiResponse.data.result.disease &&
            apiResponse.data.result.disease.suggestions) {

            // Map the suggestions to our disease format
            apiResponse.data.result.disease.suggestions.forEach(suggestion => {
                // Extract information from the suggestion
                const diseaseName = suggestion.name;
                const probability = suggestion.probability;
                let description = '';
                let treatment = '';

                // Extract description (could be expanded with more details from API if available)
                if (suggestion.details) {
                    description = `${diseaseName} detected with ${(probability * 100).toFixed(1)}% probability.`;
                }

                // Add similar images information if available
                if (suggestion.similar_images && suggestion.similar_images.length > 0) {
                    description += '\n\nSimilar cases have been documented.';
                }

                // Add generic treatment recommendations based on disease type
                if (diseaseName.includes('nutrient deficiency')) {
                    treatment = 'Consider soil testing and applying appropriate fertilizers to address specific nutrient deficiencies.';
                } else if (diseaseName.includes('water excess')) {
                    treatment = 'Reduce watering frequency. Ensure proper drainage. Check for root rot.';
                } else if (diseaseName.includes('light')) {
                    treatment = 'Adjust plant location to provide appropriate light levels.';
                } else if (diseaseName.includes('water deficiency')) {
                    treatment = 'Increase watering frequency. Consider mulching to retain soil moisture.';
                } else {
                    treatment = 'Monitor plant health and consult with a local agricultural extension service for specific treatment recommendations.';
                }

                diseases.push({
                    id: suggestion.id || `disease-${Math.random().toString(36).substring(2, 9)}`,
                    name: diseaseName,
                    probability: probability,
                    description: description,
                    treatment: treatment
                });
            });

            // Sort diseases by probability (highest first)
            diseases.sort((a, b) => b.probability - a.probability);
        }

        console.log("Processed diseases:", diseases.map(d => ({ name: d.name, probability: d.probability })));

        // Check if any high-probability disease was found (threshold of 0.7 or 70%)
        const highProbDisease = diseases.find(d => d.probability > 0.7);

        console.log("High probability disease found:", highProbDisease ? "Yes" : "No");
        if (highProbDisease) {
            console.log("Disease details:", {
                name: highProbDisease.name,
                probability: highProbDisease.probability
            });
        }

        // If high probability disease found, create an alert
        if (highProbDisease) {
            try {
                // Verify user exists before updating
                if (!req.user || !req.user._id) {
                    console.error("Cannot create alert: User information missing from request");
                    throw new Error("User information missing");
                }

                console.log("Attempting to update user location for userId:", req.user._id);
                // Update user's location with proper GeoJSON format
                await User.findByIdAndUpdate(req.user._id, {
                    location: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    }
                });

                // Ensure diseaseId is defined - this is a required field in the schema
                // If it's not available in the response, generate a unique ID
                if (!highProbDisease.id) {
                    highProbDisease.id = `disease-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
                    console.log("Generated fallback diseaseId:", highProbDisease.id);
                }

                // Create alert object
                const alertData = {
                    userId: req.user._id,
                    userName: req.user.name || "Unknown User",
                    plantType,
                    diseaseName: highProbDisease.name,
                    diseaseId: highProbDisease.id,
                    description: highProbDisease.description || `${highProbDisease.name} detected with high probability.`,
                    treatment: highProbDisease.treatment || "Consult with a local agricultural expert for treatment options.",
                    probability: highProbDisease.probability,
                    imageUrl: uploadResult.secure_url,
                    location: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    }
                };

                console.log("Alert data to be saved:", JSON.stringify(alertData));

                // Check for null or undefined fields that are required
                const requiredFields = ['userId', 'userName', 'plantType', 'diseaseName', 'diseaseId', 'probability'];
                const missingFields = requiredFields.filter(field => !alertData[field]);
                if (missingFields.length > 0) {
                    console.error("Missing required fields:", missingFields);
                    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
                }

                // Create disease alert
                const alert = new DiseaseAlert(alertData);

                // DEBUG: Validate the alert object before saving
                const validationError = alert.validateSync();
                if (validationError) {
                    console.error("Alert validation error:", validationError);
                    throw validationError;
                }

                const savedAlert = await alert.save();
                console.log("Alert saved successfully:", savedAlert._id);
            } catch (error) {
                console.error("Error saving alert:", error.message);
                console.error("Error stack:", error.stack);
                // Continue execution even if alert saving fails
            }
        }

        // Return response to client
        res.status(200).json({
            success: true,
            data: {
                diseases,
                imageUrl: uploadResult.secure_url,
                isHealthy: apiResponse.data.result?.is_healthy?.binary === true
            }
        });
    } catch (error) {
        console.error('Plant.id API error:', error.response?.data || error.message);
        console.error('Error stack:', error.stack);
        next(error);
    }
};