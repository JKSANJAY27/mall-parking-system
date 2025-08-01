const ParkingSession = require('../models/ParkingSession');
const ParkingSlot = require('../models/ParkingSlot');

const getDayBounds = (date) => {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
};

const getMonthBounds = (year, month) => {
    const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    return { start, end };
};


exports.getRevenueSummary = async (req, res) => {
    try {
        const result = await ParkingSession.aggregate([
            { $match: { status: 'Completed' } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$billingAmount' },
                    hourlyRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$billingType', 'Hourly'] }, '$billingAmount', 0]
                        }
                    },
                    dayPassRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$billingType', 'Day Pass'] }, '$billingAmount', 0]
                        }
                    },
                    totalSessions: { $sum: 1 },
                    hourlySessions: {
                        $sum: {
                            $cond: [{ $eq: ['$billingType', 'Hourly'] }, 1, 0]
                        }
                    },
                    dayPassSessions: {
                        $sum: {
                            $cond: [{ $eq: ['$billingType', 'Day Pass'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalRevenue: 1,
                    hourlyRevenue: 1,
                    dayPassRevenue: 1,
                    totalSessions: 1,
                    hourlySessions: 1,
                    dayPassSessions: 1
                }
            }
        ]);

        res.json(result[0] || { totalRevenue: 0, hourlyRevenue: 0, dayPassRevenue: 0, totalSessions: 0, hourlySessions: 0, dayPassSessions: 0 });
    } catch (err) {
        console.error('Error fetching revenue summary:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getDailyRevenue = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ msg: 'Please provide a date (YYYY-MM-DD).' });
    }

    try {
        const { start, end } = getDayBounds(date);

        const result = await ParkingSession.aggregate([
            { $match: {
                status: 'Completed',
                exitTime: { $gte: start, $lte: end }
            }},
            {
                $group: {
                    _id: {
                        hour: { $hour: '$exitTime' },
                        billingType: '$billingType'
                    },
                    revenue: { $sum: '$billingAmount' },
                    count: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: '$_id.hour',
                    totalRevenuePerHour: { $sum: '$revenue' },
                    hourlyRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.billingType', 'Hourly'] }, '$_id.revenue', 0]
                        }
                    },
                    dayPassRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.billingType', 'Day Pass'] }, '$_id.revenue', 0]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const dailyData = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            totalRevenuePerHour: 0,
            hourlyRevenue: 0,
            dayPassRevenue: 0
        }));

        result.forEach(item => {
            const hourIndex = dailyData.findIndex(d => d.hour === item._id);
            if (hourIndex !== -1) {
                dailyData[hourIndex] = {
                    hour: item._id,
                    totalRevenuePerHour: item.totalRevenuePerHour,
                    hourlyRevenue: item.hourlyRevenue,
                    dayPassRevenue: item.dayPassRevenue
                };
            }
        });

        res.json(dailyData);
    } catch (err) {
        console.error('Error fetching daily revenue:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMonthlyRevenue = async (req, res) => {
    const { year, month } = req.query;

    if (!year || !month) {
        return res.status(400).json({ msg: 'Please provide year and month.' });
    }

    try {
        const { start, end } = getMonthBounds(parseInt(year), parseInt(month));

        const result = await ParkingSession.aggregate([
            { $match: {
                status: 'Completed',
                exitTime: { $gte: start, $lte: end }
            }},
            {
                $group: {
                    _id: {
                        day: { $dayOfMonth: '$exitTime' },
                        billingType: '$billingType'
                    },
                    revenue: { $sum: '$billingAmount' }
                }
            },
            {
                $group: {
                    _id: '$_id.day',
                    totalRevenuePerDay: { $sum: '$revenue' },
                    hourlyRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.billingType', 'Hourly'] }, '$_id.revenue', 0]
                        }
                    },
                    dayPassRevenue: {
                        $sum: {
                            $cond: [{ $eq: ['$_id.billingType', 'Day Pass'] }, '$_id.revenue', 0]
                        }
                    }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const monthlyData = Array.from({ length: lastDay }, (_, i) => ({
            day: i + 1,
            totalRevenuePerDay: 0,
            hourlyRevenue: 0,
            dayPassRevenue: 0
        }));

        result.forEach(item => {
            const dayIndex = monthlyData.findIndex(d => d.day === item._id);
            if (dayIndex !== -1) {
                monthlyData[dayIndex] = {
                    day: item._id,
                    totalRevenuePerDay: item.totalRevenuePerDay,
                    hourlyRevenue: item.hourlyRevenue,
                    dayPassRevenue: item.dayPassRevenue
                };
            }
        });

        res.json(monthlyData);
    } catch (err) {
        console.error('Error fetching monthly revenue:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getPeakHours = async (req, res) => {
    const { date } = req.query;

    try {
        let matchStage = { status: 'Completed' };

        if (date) {
            const { start, end } = getDayBounds(date);
            matchStage.entryTime = { $lte: end };
            matchStage.exitTime = { $gte: start };
        } else {
        }

        const result = await ParkingSession.aggregate([
            { $match: matchStage },
            {
                $project: {
                    _id: 0,
                    entryHour: { $hour: '$entryTime' },
                    exitHour: { $hour: '$exitTime' },
                    durationMinutes: { $ceil: { $divide: [{ $subtract: ['$exitTime', '$entryTime'] }, 60000] } } // Duration in minutes
                }
            },
            {
                $group: {
                    _id: '$entryHour',
                    entryCount: { $sum: 1 },
                    totalDurationMinutes: { $sum: '$durationMinutes' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const peakHoursData = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            entryCount: 0,
            totalDurationMinutes: 0
        }));

        result.forEach(item => {
            const hourIndex = peakHoursData.findIndex(d => d.hour === item._id);
            if (hourIndex !== -1) {
                peakHoursData[hourIndex].entryCount = item.entryCount;
                peakHoursData[hourIndex].totalDurationMinutes = item.totalDurationMinutes;
            }
        });

        res.json(peakHoursData);
    } catch (err) {
        console.error('Error fetching peak hours:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getSlotUtilization = async (req, res) => {

    const { periodDays } = req.query;
    let matchDate = {};
    if (periodDays) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(periodDays));
        matchDate = { entryTime: { $gte: daysAgo } };
    }

    try {
        const slotUsage = await ParkingSession.aggregate([
            { $match: { status: 'Completed', ...matchDate } },
            {
                $group: {
                    _id: '$slot',
                    totalOccupationMinutes: {
                        $sum: {
                            $ceil: { $divide: [{ $subtract: ['$exitTime', '$entryTime'] }, 60000] }
                        }
                    },
                    sessionCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'parkingslots',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'slotInfo'
                }
            },
            { $unwind: '$slotInfo' },
            {
                $project: {
                    _id: 0,
                    slotId: '$_id',
                    slotNumber: '$slotInfo.slotNumber',
                    slotType: '$slotInfo.slotType',
                    totalOccupationMinutes: 1,
                    sessionCount: 1
                }
            },
            { $sort: { totalOccupationMinutes: 1, sessionCount: 1 } }
        ]);

        res.json(slotUsage);
    } catch (err) {
        console.error('Error fetching slot utilization:', err.message);
        res.status(500).send('Server Error');
    }
};