import mongoose from 'mongoose';

const diseaseAlertSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    plantType: {
        type: String,
        required: true
    },
    diseaseName: {
        type: String,
        required: true
    },
    diseaseId: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    treatment: {
        type: String,
        default: ''
    },
    probability: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        default: ''
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    }
}, {
    timestamps: true
});

// Create geospatial index for location-based queries
diseaseAlertSchema.index({ location: '2dsphere' });

// Static method to find nearby alerts
diseaseAlertSchema.statics.findNearby = async function (longitude, latitude, radius = 100, plantTypes = []) {
    try {
        console.log(`findNearby - Raw input coordinates: longitude=${longitude} (${typeof longitude}), latitude=${latitude} (${typeof latitude})`);

        // Force conversion to numbers
        let normalizedLongitude = Number(longitude);
        if (isNaN(normalizedLongitude)) {
            throw new Error(`Invalid longitude value: ${longitude}`);
        }

        // Normalize longitude to be within -180 to 180
        // This formula properly handles negative values beyond -180
        normalizedLongitude = ((normalizedLongitude % 360) + 540) % 360 - 180;

        // Validate latitude (between -90 and 90)
        const normalizedLatitude = Number(latitude);
        if (isNaN(normalizedLatitude)) {
            throw new Error(`Invalid latitude value: ${latitude}`);
        }

        if (normalizedLatitude < -90 || normalizedLatitude > 90) {
            throw new Error(`Latitude out of bounds: ${normalizedLatitude}. Must be between -90 and 90`);
        }

        console.log(`findNearby - Final normalized coordinates: [${normalizedLongitude}, ${normalizedLatitude}]`);

        // Create the query after successful normalization
        const query = {
            location: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [normalizedLongitude, normalizedLatitude]
                    },
                    $maxDistance: Number(radius) * 1000 // Convert km to meters
                }
            }
        };

        // Filter by plant type if provided
        if (plantTypes && Array.isArray(plantTypes) && plantTypes.length > 0) {
            query.plantType = { $in: plantTypes };
        }

        console.log('findNearby - Final MongoDB query:', JSON.stringify(query));

        // Find alerts within the specified radius
        const alerts = await this.find(query)
            .sort({ createdAt: -1 })
            .limit(20);

        console.log(`findNearby - Found ${alerts.length} alerts`);

        return alerts;
    } catch (error) {
        console.error('Error finding nearby alerts:', error.message, error.stack);
        throw error;
    }
};

const DiseaseAlert = mongoose.model('DiseaseAlert', diseaseAlertSchema);

export default DiseaseAlert;