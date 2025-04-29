import mongoose from "mongoose";

const culture = new mongoose.Schema({
    type: {
        type: String,
        List: {
            values: ['Wheat', 'Corn', 'Rice', 'Barley', 'Oats', 'Soybeans', 'Potatoes', 'Tomatoes', 'Onions', 'Lettuce', 'Carrots', 'Olives', 'Grapes', 'Apples', 'Oranges'],
            message: '{VALUE} is not a recognized culture type'
        },
        required: true
    },
    experience: {
        type: Number,
        required: true
    }
});

// Allow users to add their own option if it doesn't exist in the enum
culture.path('type').validate(function (value) {
    if (!this.schema.path('type').enumValues.includes(value)) {
        // Add the new value to the enum values
        this.schema.path('type').enumValues.push(value);
    }
    return true;
}, 'Invalid culture type');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    // Add geolocation for proximity searches
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: [0, 0]
        }
    },
    cultureType: [culture],
    password: {
        type: String,
        required: true
    },
    // Reference to user's culture history entries
    cultureHistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CultureHistory'
    }]
}, {
    timestamps: true
})

// Create a geospatial index on the location field
userSchema.index({ location: '2dsphere' });

const User = mongoose.model("User", userSchema);
export default User;