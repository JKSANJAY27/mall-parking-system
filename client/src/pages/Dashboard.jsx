import React, { useEffect, useState, useCallback } from 'react';
import * as api from '../api';
import SlotCard from '../components/SlotCard';

const Dashboard = () => {
    const [counts, setCounts] = useState({
        totalSlots: 0,
        freeSlots: 0,
        occupiedSlots: 0,
        maintenanceSlots: 0
    });
    const [slots, setSlots] = useState([]);
    const [filterType, setFilterType] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);

    const fetchDashboardData = useCallback(async (params = {}) => {
        if (initialLoad) {
            setLoading(true);
        }
        setError(null);
        try {
            const countsRes = await api.getDashboardCounts();
            setCounts(countsRes.data);

            const slotsRes = await api.getAllSlots(params);
            setSlots(slotsRes.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    }, [initialLoad]);

    useEffect(() => {
        fetchDashboardData({ slotType: filterType });
        const interval = setInterval(() => {
            fetchDashboardData({ slotType: filterType });
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchDashboardData, filterType]);

    const handleFilterChange = (type) => {
        setFilterType(type === filterType ? '' : type);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSlotStatusChange = async (slotId, newStatus) => {
        try {
            await api.updateSlotStatus(slotId, newStatus);
            fetchDashboardData({ slotType: filterType });
        } catch (err) {
            console.error('Failed to update slot status:', err);
            setError(err.response?.data?.msg || 'Failed to update slot status. Check console for details.');
        }
    };

    const filteredSlots = slots.filter(slot =>
        (slot.currentSession?.vehicleNumberPlate.includes(searchTerm.toUpperCase()) ||
         slot.slotNumber.toUpperCase().includes(searchTerm.toUpperCase())) ||
        searchTerm === ''
    );

    const seedInitialSlots = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.seedSlots();
            alert(res.data.msg);
            fetchDashboardData();
        } catch (err) {
            console.error('Failed to seed slots:', err);
            setError(err.response?.data?.msg || 'Failed to seed slots.');
        } finally {
            setLoading(false);
        }
    };

    // Enhanced loading state with skeleton
    if (loading && initialLoad) {
        return (
            <div className="min-h-screen bg-gray-50">
                {/* Header Skeleton */}
                <div className="bg-white shadow-sm border-b">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                    </div>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Stats Cards Skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                                        <div className="h-8 bg-gray-200 rounded w-12 animate-pulse"></div>
                                    </div>
                                    <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filters Skeleton */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex flex-wrap gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="h-9 bg-gray-200 rounded-lg w-20 animate-pulse"></div>
                                ))}
                            </div>
                            <div className="h-9 bg-gray-200 rounded-lg w-80 animate-pulse"></div>
                        </div>
                    </div>

                    {/* Slots Grid Skeleton */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="h-6 bg-gray-200 rounded w-40 mb-6 animate-pulse"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-gray-50 rounded-lg p-4 border animate-pulse">
                                    <div className="h-6 bg-gray-200 rounded w-16 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-red-600 mb-4">{error}</p>
                        <button
                            onClick={() => fetchDashboardData()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // No slots state
    if (counts.totalSlots === 0 && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
                    <div className="text-center">
                        <div className="text-gray-400 text-6xl mb-4">🅿️</div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Parking Slots</h2>
                        <p className="text-gray-600 mb-6">Get started by creating your initial parking slots.</p>
                        <button
                            onClick={seedInitialSlots}
                            disabled={loading}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Slots...' : 'Create Initial Slots'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Parking Dashboard</h1>
                    <p className="text-gray-600 mt-1">Real-time parking slot monitoring</p>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Total Slots</p>
                                <p className="text-3xl font-bold text-gray-900">{counts.totalSlots}</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Available</p>
                                <p className="text-3xl font-bold text-green-600">{counts.freeSlots}</p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-green-600 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Occupied</p>
                                <p className="text-3xl font-bold text-red-600">{counts.occupiedSlots}</p>
                            </div>
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-red-600 rounded"></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                                <p className="text-3xl font-bold text-yellow-600">{counts.maintenanceSlots}</p>
                            </div>
                            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleFilterChange('')}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    filterType === '' 
                                        ? 'bg-blue-600 text-white shadow-sm' 
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                            >
                                All Types
                            </button>
                            {['Car', 'Bike', 'EV', 'Handicap Accessible'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleFilterChange(type)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                        filterType === type 
                                            ? 'bg-blue-600 text-white shadow-sm' 
                                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                    }`}
                                >
                                    {type}s
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search by plate or slot number..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="block w-full lg:w-80 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-black"
                            />
                        </div>
                    </div>
                </div>

                {/* Slots Grid */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                    {filteredSlots.length > 0 ? (
                        <>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Parking Slots ({filteredSlots.length})
                                </h2>
                                <div className="flex items-center text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                                    Auto-refresh every 5s
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {filteredSlots.map(slot => (
                                    <SlotCard 
                                        key={slot._id} 
                                        slot={slot} 
                                        onStatusChange={handleSlotStatusChange} 
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-5xl mb-4">🔍</div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No slots found</h3>
                            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;