// filepath: c:\GitHub\hackathon\server\models\CultureHistory.js
import mongoose from 'mongoose';

const cultureHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    cultureType: {
        type: String,
        required: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        default: ''
    },
    yield: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'failed'],
        default: 'active'
    },
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Method to calculate statistics from culture history
cultureHistorySchema.statics.getYieldStatistics = async function (userId) {
    try {
        // Group data by culture type and calculate statistics
        const stats = await this.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$cultureType',
                    totalYield: { $sum: '$yield' },
                    totalHarvests: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    totalAttempts: { $sum: { $cond: [{ $ne: ['$status', 'active'] }, 1, 0] } },
                    entries: { $push: { yield: '$yield', status: '$status' } }
                }
            },
            {
                $project: {
                    cultureType: '$_id',
                    _id: 0,
                    averageYield: {
                        $cond: [
                            { $gt: ['$totalHarvests', 0] },
                            { $divide: ['$totalYield', '$totalHarvests'] },
                            0
                        ]
                    },
                    totalHarvests: 1,
                    successRate: {
                        $cond: [
                            { $gt: ['$totalAttempts', 0] },
                            {
                                $multiply: [
                                    {
                                        $divide: [
                                            '$totalHarvests',
                                            '$totalAttempts'
                                        ]
                                    },
                                    100
                                ]
                            },
                            0
                        ]
                    }
                }
            }
        ]);

        return stats;
    } catch (error) {
        console.error('Error calculating yield statistics:', error);
        throw error;
    }
};

const CultureHistory = mongoose.model('CultureHistory', cultureHistorySchema);

export default CultureHistory;