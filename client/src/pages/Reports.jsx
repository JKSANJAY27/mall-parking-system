import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../api';

const Reports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Revenue States
    const [revenueSummary, setRevenueSummary] = useState(null);
    const [dailyRevenueDate, setDailyRevenueDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
    const [dailyRevenueData, setDailyRevenueData] = useState([]);
    const [monthlyRevenueYear, setMonthlyRevenueYear] = useState(new Date().getFullYear());
    const [monthlyRevenueMonth, setMonthlyRevenueMonth] = useState(new Date().getMonth() + 1); // JS months are 0-indexed
    const [monthlyRevenueData, setMonthlyRevenueData] = useState([]);

    // Utilization States
    const [peakHoursDate, setPeakHoursDate] = useState(''); // Empty string for all-time or pick a date
    const [peakHoursData, setPeakHoursData] = useState([]);
    const [slotUtilizationPeriod, setSlotUtilizationPeriod] = useState(30); // Default 30 days
    const [slotUtilizationData, setSlotUtilizationData] = useState([]);


    const fetchReports = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [
                summaryRes,
                dailyRes,
                monthlyRes,
                peakRes,
                slotRes
            ] = await Promise.all([
                api.getRevenueSummary(),
                api.getDailyRevenue(dailyRevenueDate),
                api.getMonthlyRevenue(monthlyRevenueYear, monthlyRevenueMonth),
                api.getPeakHours(peakHoursDate),
                api.getSlotUtilization(slotUtilizationPeriod)
            ]);

            setRevenueSummary(summaryRes.data);
            setDailyRevenueData(dailyRes.data);
            setMonthlyRevenueData(monthlyRes.data);
            setPeakHoursData(peakRes.data);
            setSlotUtilizationData(slotRes.data);

        } catch (err) {
            console.error('Failed to fetch reports:', err);
            setError(err.response?.data?.msg || 'Failed to load reports. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [dailyRevenueDate, monthlyRevenueYear, monthlyRevenueMonth, peakHoursDate, slotUtilizationPeriod]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);


    if (loading && !error && (!revenueSummary && dailyRevenueData.length === 0 && monthlyRevenueData.length === 0)) {
        return <div className="text-center text-lg font-medium py-10">Loading reports...</div>;
    }
    if (error) {
        return <div className="text-center text-red-600 font-bold py-10">{error}</div>;
    }

    const monthNames = ["January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"];

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Advanced Reports & Analytics</h1>

            {/* Revenue Summary */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    💰 Overall Revenue Summary
                </h2>
                {revenueSummary ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-blue-50 rounded-md">
                            <p className="text-lg font-semibold text-blue-700">Total Revenue</p>
                            <p className="text-3xl font-bold text-blue-600">₹{revenueSummary.totalRevenue.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">({revenueSummary.totalSessions} sessions)</p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-md">
                            <p className="text-lg font-semibold text-green-700">Hourly Revenue</p>
                            <p className="text-3xl font-bold text-green-600">₹{revenueSummary.hourlyRevenue.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">({revenueSummary.hourlySessions} sessions)</p>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-md">
                            <p className="text-lg font-semibold text-purple-700">Day Pass Revenue</p>
                            <p className="text-3xl font-bold text-purple-600">₹{revenueSummary.dayPassRevenue.toFixed(2)}</p>
                            <p className="text-sm text-gray-600">({revenueSummary.dayPassSessions} sessions)</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-gray-600">No revenue data available yet.</p>
                )}
            </div>

            {/* Daily Revenue Report */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    📈 Daily Revenue Breakdown
                </h2>
                <div className="mb-4">
                    <label htmlFor="dailyDate" className="block text-sm font-medium text-gray-700 mb-1">Select Date:</label>
                    <input
                        type="date"
                        id="dailyDate"
                        value={dailyRevenueDate}
                        onChange={(e) => setDailyRevenueDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-black"
                    />
                </div>
                {dailyRevenueData.length > 0 ? (
                    <div className="overflow-x-auto text-black">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <th className="py-3 px-4 border-b">Hour</th>
                                    <th className="py-3 px-4 border-b">Total Revenue</th>
                                    <th className="py-3 px-4 border-b">Hourly Revenue</th>
                                    <th className="py-3 px-4 border-b">Day Pass Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dailyRevenueData.map(data => (
                                    <tr key={data.hour} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">{data.hour}:00 - {data.hour + 1}:00</td>
                                        <td className="py-3 px-4">₹{data.totalRevenuePerHour.toFixed(2)}</td>
                                        <td className="py-3 px-4">₹{data.hourlyRevenue.toFixed(2)}</td>
                                        <td className="py-3 px-4">₹{data.dayPassRevenue.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-600">No daily revenue data for this date.</p>
                )}
            </div>

            {/* Monthly Revenue Report */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    🗓️ Monthly Revenue Breakdown
                </h2>
                <div className="mb-4 flex gap-4">
                    <div>
                        <label htmlFor="monthlyYear" className="block text-sm font-medium text-gray-700 mb-1">Year:</label>
                        <input
                            type="number"
                            id="monthlyYear"
                            value={monthlyRevenueYear}
                            onChange={(e) => setMonthlyRevenueYear(parseInt(e.target.value))}
                            className="p-2 border border-gray-300 rounded-md w-28 text-black"
                        />
                    </div>
                    <div>
                        <label htmlFor="monthlyMonth" className="block text-sm font-medium text-gray-700 mb-1">Month:</label>
                        <select
                            id="monthlyMonth"
                            value={monthlyRevenueMonth}
                            onChange={(e) => setMonthlyRevenueMonth(parseInt(e.target.value))}
                            className="p-2 border border-gray-300 rounded-md text-black"
                        >
                            {monthNames.map((name, index) => (
                                <option key={index + 1} value={index + 1}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {monthlyRevenueData.length > 0 ? (
                    <div className="overflow-x-auto text-black">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <th className="py-3 px-4 border-b">Day</th>
                                    <th className="py-3 px-4 border-b">Total Revenue</th>
                                    <th className="py-3 px-4 border-b">Hourly Revenue</th>
                                    <th className="py-3 px-4 border-b">Day Pass Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyRevenueData.map(data => (
                                    <tr key={data.day} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">Day {data.day}</td>
                                        <td className="py-3 px-4">₹{data.totalRevenuePerDay.toFixed(2)}</td>
                                        <td className="py-3 px-4">₹{data.hourlyRevenue.toFixed(2)}</td>
                                        <td className="py-3 px-4">₹{data.dayPassRevenue.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-600">No monthly revenue data for this period.</p>
                )}
            </div>

            {/* Peak Hours Report */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    ⏰ Peak Hours (Entry Count)
                </h2>
                 <div className="mb-4">
                    <label htmlFor="peakDate" className="block text-sm font-medium text-gray-700 mb-1">Analyze for Date (Optional):</label>
                    <input
                        type="date"
                        id="peakDate"
                        value={peakHoursDate}
                        onChange={(e) => setPeakHoursDate(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md text-black"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave blank for all historical data (based on entry time).</p>
                </div>
                {peakHoursData.length > 0 ? (
                    <div className="overflow-x-auto text-black">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <th className="py-3 px-4 border-b">Hour</th>
                                    <th className="py-3 px-4 border-b">Entry Count</th>
                                    <th className="py-3 px-4 border-b">Total Occupation (Min)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {peakHoursData.map(data => (
                                    <tr key={data.hour} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">{data.hour}:00 - {data.hour + 1}:00</td>
                                        <td className="py-3 px-4">{data.entryCount}</td>
                                        <td className="py-3 px-4">{data.totalDurationMinutes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-600">No peak hour data available.</p>
                )}
            </div>

            {/* Slot Utilization Report */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    📊 Slot Utilization (Underused Slots)
                </h2>
                <div className="mb-4">
                    <label htmlFor="utilizationPeriod" className="block text-sm font-medium text-gray-700 mb-1">Analyze for last days:</label>
                    <input
                        type="number"
                        id="utilizationPeriod"
                        value={slotUtilizationPeriod}
                        onChange={(e) => setSlotUtilizationPeriod(parseInt(e.target.value))}
                        className="p-2 border border-gray-300 rounded-md w-28 text-black"
                        min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Shows slots with least occupation time/sessions.</p>
                </div>
                {slotUtilizationData.length > 0 ? (
                    <div className="overflow-x-auto text-black">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead>
                                <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    <th className="py-3 px-4 border-b">Slot Number</th>
                                    <th className="py-3 px-4 border-b">Slot Type</th>
                                    <th className="py-3 px-4 border-b">Total Occupied (Min)</th>
                                    <th className="py-3 px-4 border-b">Sessions Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slotUtilizationData.map(data => (
                                    <tr key={data.slotId} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">{data.slotNumber}</td>
                                        <td className="py-3 px-4">{data.slotType}</td>
                                        <td className="py-3 px-4">{data.totalOccupationMinutes}</td>
                                        <td className="py-3 px-4">{data.sessionCount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-600">No slot utilization data available for this period.</p>
                )}
            </div>

        </div>
    );
};

export default Reports;