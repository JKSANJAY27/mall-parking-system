import React, { useState } from 'react';

const VehicleForm = ({ onSubmit, isLoading, message, isError }) => {
    const [numberPlate, setNumberPlate] = useState('');
    const [vehicleType, setVehicleType] = useState('Car');
    const [billingType, setBillingType] = useState('Hourly');
    const [manualSlotId, setManualSlotId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ 
            numberPlate: numberPlate.trim(), 
            vehicleType, 
            billingType, 
            manualSlotId: manualSlotId.trim() || undefined 
        });
        setNumberPlate('');
        setManualSlotId('');
    };

    const getVehicleTypeIcon = (type) => {
        switch (type) {
            case 'Car': return '🚗';
            case 'Bike': return '🏍️';
            case 'EV': return '🔋';
            case 'Handicap Accessible': return '♿';
            default: return '🅿️';
        }
    };

    const getBillingTypeIcon = (type) => {
        switch (type) {
            case 'Hourly': return '⏰';
            case 'Day Pass': return '📅';
            default: return '💰';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-lg mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🅿️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Vehicle Check-In</h1>
                    <p className="text-gray-600">Enter vehicle details to assign a parking slot</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Number Plate Field */}
                        <div className="space-y-2">
                            <label htmlFor="numberPlate" className="block text-sm font-semibold text-gray-900">
                                Vehicle Number Plate
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 text-sm">🚙</span>
                                </div>
                                <input
                                    type="text"
                                    id="numberPlate"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-colors"
                                    value={numberPlate}
                                    onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                                    placeholder="e.g., TN01AB1234"
                                    required
                                />
                            </div>
                            <p className="text-xs text-gray-500">Enter the vehicle's registration number</p>
                        </div>

                        {/* Vehicle Type Field */}
                        <div className="space-y-2">
                            <label htmlFor="vehicleType" className="block text-sm font-semibold text-gray-900">
                                Vehicle Type
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 text-sm">{getVehicleTypeIcon(vehicleType)}</span>
                                </div>
                                <select
                                    id="vehicleType"
                                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-colors appearance-none"
                                    value={vehicleType}
                                    onChange={(e) => setVehicleType(e.target.value)}
                                    required
                                >
                                    <option value="Car">🚗 Car</option>
                                    <option value="Bike">🏍️ Bike</option>
                                    <option value="EV">🔋 Electric Vehicle</option>
                                    <option value="Handicap Accessible">♿ Handicap Accessible</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Billing Type Field */}
                        <div className="space-y-2">
                            <label htmlFor="billingType" className="block text-sm font-semibold text-gray-900">
                                Billing Type
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setBillingType('Hourly')}
                                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                        billingType === 'Hourly'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">⏰</div>
                                        <div className="font-semibold">Hourly</div>
                                        <div className="text-xs text-gray-500">Pay per hour</div>
                                    </div>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingType('Day Pass')}
                                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                        billingType === 'Day Pass'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                                >
                                    <div className="text-center">
                                        <div className="text-2xl mb-1">📅</div>
                                        <div className="font-semibold">Day Pass</div>
                                        <div className="text-xs text-gray-500">Full day access</div>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Manual Slot ID Field */}
                        <div className="space-y-2">
                            <label htmlFor="manualSlotId" className="block text-sm font-semibold text-gray-900">
                                Specific Slot (Optional)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-400 text-sm">🎯</span>
                                </div>
                                <input
                                    type="text"
                                    id="manualSlotId"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 transition-colors"
                                    value={manualSlotId}
                                    onChange={(e) => setManualSlotId(e.target.value)}
                                    placeholder="e.g., A-001 (optional)"
                                />
                            </div>
                            <p className="text-xs text-gray-500">Leave empty for automatic slot assignment</p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !numberPlate.trim()}
                            className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Assigning Slot...
                                </>
                            ) : (
                                <>
                                    <span className="mr-2">🅿️</span>
                                    Assign Parking Slot
                                </>
                            )}
                        </button>
                    </form>

                    {/* Message Display */}
                    {message && (
                        <div className={`mt-6 p-4 rounded-lg border ${
                            isError 
                                ? 'bg-red-50 border-red-200 text-red-800' 
                                : 'bg-green-50 border-green-200 text-green-800'
                        }`}>
                            <div className="flex items-center">
                                <div className="mr-3 text-lg">
                                    {isError ? '❌' : '✅'}
                                </div>
                                <div>
                                    <p className="font-medium">{isError ? 'Check-in Failed' : 'Success!'}</p>
                                    <p className="text-sm mt-1">{message}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                        <div className="mr-3 text-blue-600 text-lg">💡</div>
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-1">Quick Tips</h3>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>• Number plates are automatically converted to uppercase</li>
                                <li>• Leave slot field empty for automatic assignment</li>
                                <li>• EV vehicles will be assigned to charging-enabled slots when available</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleForm;