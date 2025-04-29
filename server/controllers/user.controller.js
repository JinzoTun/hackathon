import User from "../models/user.model.js";
import CultureHistory from "../models/CultureHistory.js";
import mongoose from "mongoose";

/**
 * Add culture types to user profile
 * @route POST /api/v1/users/add-cultures
 * @access Private
 */
export const addCultures = async (req, res, next) => {
    try {
        const { cultures } = req.body;
        const userId = req.user._id;

        if (!cultures || !Array.isArray(cultures)) {
            return res.status(400).json({
                success: false,
                error: "Please provide an array of culture types",
            });
        }

        // Validate each culture object
        for (const culture of cultures) {
            if (!culture.type) {
                return res.status(400).json({
                    success: false,
                    error: "Each culture must have a type",
                });
            }

            if (typeof culture.experience !== 'number' || culture.experience < 1 || culture.experience > 10) {
                return res.status(400).json({
                    success: false,
                    error: "Experience must be a number between 1 and 10",
                });
            }
        }

        // Find the user and update
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }

        // Add each culture to the user's profile
        cultures.forEach(culture => {
            // Check if the culture type already exists for this user
            const existingCulture = user.cultureType.find(
                c => c.type.toLowerCase() === culture.type.toLowerCase()
            );

            if (existingCulture) {
                // Update the experience if it already exists
                existingCulture.experience = culture.experience;
            } else {
                // Add new culture type
                user.cultureType.push(culture);
            }
        });

        await user.save();

        // Return user without password
        const userResponse = await User.findById(userId).select('-password');

        res.status(200).json({
            success: true,
            message: "Culture types added successfully",
            data: userResponse,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get available culture types
 * @route GET /api/v1/users/culture-types
 * @access Private
 */
export const getCultureTypes = async (req, res, next) => {
    try {
        // Default culture types from schema
        const defaultTypes = [
            'Wheat', 'Corn', 'Rice', 'Barley', 'Oats',
            'Soybeans', 'Potatoes', 'Tomatoes', 'Onions',
            'Lettuce', 'Carrots', 'Olives', 'Grapes',
            'Apples', 'Oranges'
        ];

        // Get custom culture types from all users
        const users = await User.find({});
        const customTypes = new Set();

        users.forEach(user => {
            user.cultureType.forEach(culture => {
                if (!defaultTypes.includes(culture.type)) {
                    customTypes.add(culture.type);
                }
            });
        });

        // Combine default and custom types
        const allTypes = [...defaultTypes, ...Array.from(customTypes)];

        res.status(200).json({
            success: true,
            data: allTypes
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove a culture type from user profile
 * @route DELETE /api/v1/users/remove-culture/:id
 * @access Private
 */
export const removeCulture = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid culture ID",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }

        // Find the culture index in the array
        const cultureIndex = user.cultureType.findIndex(
            (culture) => culture._id.toString() === id
        );

        if (cultureIndex === -1) {
            return res.status(404).json({
                success: false,
                error: "Culture type not found in user profile",
            });
        }

        // Remove the culture type
        user.cultureType.splice(cultureIndex, 1);
        await user.save();

        res.status(200).json({
            success: true,
            message: "Culture type removed successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user profile basic information
 * @route PUT /api/v1/users/update-profile
 * @access Private
 */
export const updateProfile = async (req, res, next) => {
    try {
        const { name, address } = req.body;
        const userId = req.user._id;

        const updateFields = {};
        if (name) updateFields.name = name;
        if (address) updateFields.address = address;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update user location
 * @route PUT /api/v1/users/update-location
 * @access Private
 */
export const updateUserLocation = async (req, res, next) => {
    try {
        const { longitude, latitude } = req.body;
        const userId = req.user._id;

        // Validate coordinates
        if (!longitude || !latitude ||
            isNaN(parseFloat(longitude)) || isNaN(parseFloat(latitude))) {
            return res.status(400).json({
                success: false,
                error: "Valid longitude and latitude are required"
            });
        }

        // Update user's location
        const user = await User.findByIdAndUpdate(
            userId,
            {
                'location.coordinates': [parseFloat(longitude), parseFloat(latitude)]
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Location updated successfully",
            data: {
                location: user.location
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user culture history
 * @route GET /api/v1/users/culture-history
 * @access Private
 */
export const getCultureHistory = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const history = await CultureHistory.find({ user: userId })
            .sort({ startDate: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: history
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add culture history entry
 * @route POST /api/v1/users/add-history
 * @access Private
 */
export const addCultureHistory = async (req, res, next) => {
    try {
        const { cultureType, startDate, endDate, yield: yieldAmount, status, notes } = req.body;
        const userId = req.user._id;

        // Validate required fields
        if (!cultureType || !startDate) {
            return res.status(400).json({
                success: false,
                error: "Culture type and start date are required",
            });
        }

        // Determine status if not provided
        let entryStatus = status;
        if (!entryStatus) {
            entryStatus = endDate ? 'completed' : 'active';
        }

        // Create new history entry
        const historyEntry = new CultureHistory({
            user: userId,
            cultureType,
            startDate,
            endDate: endDate || '',
            yield: yieldAmount || 0,
            status: entryStatus,
            notes: notes || '',
        });

        await historyEntry.save();

        // Add reference to user model
        await User.findByIdAndUpdate(userId, {
            $push: { cultureHistory: historyEntry._id }
        });

        res.status(201).json({
            success: true,
            message: "Culture history entry added successfully",
            data: historyEntry
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update culture history entry
 * @route PUT /api/v1/users/update-history/:id
 * @access Private
 */
export const updateCultureHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { endDate, yield: yieldAmount, status, notes } = req.body;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid history entry ID",
            });
        }

        // Find the history entry
        const historyEntry = await CultureHistory.findById(id);

        if (!historyEntry) {
            return res.status(404).json({
                success: false,
                error: "History entry not found",
            });
        }

        // Verify ownership
        if (historyEntry.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized: You do not own this history entry",
            });
        }

        // Update fields
        if (endDate !== undefined) historyEntry.endDate = endDate;
        if (yieldAmount !== undefined) historyEntry.yield = yieldAmount;
        if (status) historyEntry.status = status;
        if (notes !== undefined) historyEntry.notes = notes;

        await historyEntry.save();

        res.status(200).json({
            success: true,
            message: "Culture history entry updated successfully",
            data: historyEntry
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete culture history entry
 * @route DELETE /api/v1/users/delete-history/:id
 * @access Private
 */
export const deleteCultureHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid history entry ID",
            });
        }

        // Find the history entry
        const historyEntry = await CultureHistory.findById(id);

        if (!historyEntry) {
            return res.status(404).json({
                success: false,
                error: "History entry not found",
            });
        }

        // Verify ownership
        if (historyEntry.user.toString() !== userId.toString()) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized: You do not own this history entry",
            });
        }

        // Delete the entry
        await CultureHistory.findByIdAndDelete(id);

        // Remove reference from user
        await User.findByIdAndUpdate(userId, {
            $pull: { cultureHistory: id }
        });

        res.status(200).json({
            success: true,
            message: "Culture history entry deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get yield statistics
 * @route GET /api/v1/users/yield-statistics
 * @access Private
 */
export const getYieldStatistics = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Calculate statistics using the static method from CultureHistory model
        const statistics = await CultureHistory.getYieldStatistics(userId);

        res.status(200).json({
            success: true,
            data: statistics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get summary statistics for dashboard
 * @route GET /api/v1/users/culture-summary
 * @access Private
 */
export const getCultureSummary = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Get user with culture types
        const user = await User.findById(userId).select('cultureType');

        // Get history summary
        const historyCounts = await CultureHistory.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    status: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Format summary data
        const summary = {
            totalCultureTypes: user.cultureType.length,
            totalHistoryEntries: 0,
            activeCount: 0,
            completedCount: 0,
            failedCount: 0
        };

        // Calculate counts from aggregation results
        historyCounts.forEach(item => {
            if (item.status === 'active') summary.activeCount = item.count;
            if (item.status === 'completed') summary.completedCount = item.count;
            if (item.status === 'failed') summary.failedCount = item.count;
            summary.totalHistoryEntries += item.count;
        });

        res.status(200).json({
            success: true,
            data: summary
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all users
 * @route GET /api/v1/users
 * @access Private
 */
export const getAllUsers = async (req, res, next) => {
    try {
        // Fetch all users excluding the password field
        const users = await User.find()
            .select('-password -__v')
            .lean();

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};