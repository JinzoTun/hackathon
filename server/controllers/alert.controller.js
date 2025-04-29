import DiseaseAlert from '../models/DiseaseAlert.js';
import User from '../models/user.model.js';

/**
 * Get nearby disease alerts
 * @route GET /api/v1/alerts/nearby
 * @access Private
 */
export const getNearbyAlerts = async (req, res, next) => {
    try {
        const { longitude, latitude, radius = 100 } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({
                success: false,
                error: 'Location coordinates are required'
            });
        }

        // Convert to numbers
        const longNum = Number(longitude);
        const latNum = Number(latitude);

        // Normalize coordinates before passing to the model
        // Valid longitude range is -180 to 180
        const normalizedLongitude = ((longNum % 360) + 540) % 360 - 180;

        // Valid latitude range is -90 to 90
        if (isNaN(latNum) || latNum < -90 || latNum > 90) {
            return res.status(400).json({
                success: false,
                error: 'Invalid latitude value: must be between -90 and 90'
            });
        }

        console.log(`Original coordinates: [${longitude}, ${latitude}], Normalized: [${normalizedLongitude}, ${latNum}]`);

        // Get the user's culture types to filter relevant alerts
        const user = await User.findById(req.user._id);
        const userCultureTypes = user?.cultureType?.map(c => c.type) || [];

        // Find nearby alerts using the static method
        const alerts = await DiseaseAlert.findNearby(
            normalizedLongitude,
            latNum,
            radius,
            userCultureTypes
        );

        res.status(200).json({
            success: true,
            data: alerts
        });
    } catch (error) {
        console.error('Error in getNearbyAlerts controller:', error);
        next(error);
    }
};

/**
 * Get all alerts for a specific plant type
 * @route GET /api/v1/alerts/:plantType
 * @access Private
 */
export const getAlertsByPlantType = async (req, res, next) => {
    try {
        const { plantType } = req.params;

        const alerts = await DiseaseAlert.find({ plantType })
            .sort({ createdAt: -1 })
            .limit(20);

        res.status(200).json({
            success: true,
            data: alerts
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all alerts created by the current user
 * @route GET /api/v1/alerts/my-alerts
 * @access Private
 */
export const getUserAlerts = async (req, res, next) => {
    try {
        const alerts = await DiseaseAlert.find({ userId: req.user._id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: alerts
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a disease alert
 * @route DELETE /api/v1/alerts/:id
 * @access Private
 */
export const deleteAlert = async (req, res, next) => {
    try {
        const { id } = req.params;

        const alert = await DiseaseAlert.findById(id);

        if (!alert) {
            return res.status(404).json({
                success: false,
                error: 'Alert not found'
            });
        }

        // Check if the alert belongs to the current user
        if (alert.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized: You can only delete your own alerts'
            });
        }

        await DiseaseAlert.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Alert deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};