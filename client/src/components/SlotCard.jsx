import React from 'react';

const SlotCard = ({ slot, onStatusChange }) => {
    // Status-based styling
    const getStatusStyles = () => {
        switch (slot.status) {
            case 'Occupied':
                return {
                    cardBg: 'bg-red-50',
                    cardBorder: 'border-red-200',
                    statusColor: 'text-red-700',
                    statusBg: 'bg-red-100',
                    icon: '🚗',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600'
                };
            case 'Maintenance':
                return {
                    cardBg: 'bg-yellow-50',
                    cardBorder: 'border-yellow-200',
                    statusColor: 'text-yellow-700',
                    statusBg: 'bg-yellow-100',
                    icon: '🔧',
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    buttonClass: 'bg-green-600 text-white hover:bg-green-700',
                    buttonText: 'Mark Available'
                };
            default: // Available
                return {
                    cardBg: 'bg-green-50',
                    cardBorder: 'border-green-200',
                    statusColor: 'text-green-700',
                    statusBg: 'bg-green-100',
                    icon: '✅',
                    iconBg: 'bg-green-100',
                    iconColor: 'text-green-600',
                    buttonClass: 'bg-yellow-600 text-white hover:bg-yellow-700',
                    buttonText: 'Mark Maintenance'
                };
        }
    };

    const styles = getStatusStyles();

    const handleStatusToggle = () => {
        const newStatus = slot.status === 'Maintenance' ? 'Available' : 'Maintenance';
        onStatusChange(slot._id, newStatus);
    };

    const getSlotTypeIcon = (type) => {
        switch (type) {
            case 'Car': return '🚗';
            case 'Bike': return '🏍️';
            case 'EV': return '🔋';
            case 'Handicap Accessible': return '♿';
            default: return '🅿️';
        }
    };

    return (
        <div className={`
            ${styles.cardBg} 
            ${styles.cardBorder} 
            border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 
            p-5 w-full max-w-sm bg-white
        `}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
                        <span className="text-sm">{styles.icon}</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{slot.slotNumber}</h3>
                        <p className="text-sm text-gray-600">
                            {getSlotTypeIcon(slot.slotType)} {slot.slotType}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            <div className="mb-4">
                <span className={`
                    inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                    ${styles.statusBg} ${styles.statusColor}
                `}>
                    {slot.status}
                </span>
            </div>

            {/* Occupied Vehicle Details */}
            {slot.status === 'Occupied' && slot.currentSession && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Vehicle:</span>
                            <span className="text-sm font-bold text-gray-900 font-mono">
                                {slot.currentSession.vehicleNumberPlate}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Entry Time:</span>
                            <span className="text-sm text-gray-900">
                                {new Date(slot.currentSession.entryTime).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        {slot.currentSession.entryTime && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Duration:</span>
                                <span className="text-sm text-gray-900">
                                    {(() => {
                                        const now = new Date();
                                        const entry = new Date(slot.currentSession.entryTime);
                                        const diffMs = now - entry;
                                        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                                        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                        return `${diffHours}h ${diffMins}m`;
                                    })()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* EV Charger Info */}
            {slot.slotType === 'EV' && (
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Charger:</span>
                    <span className={`text-sm font-medium ${
                        slot.isChargerAvailable 
                            ? 'text-green-700 bg-green-100 px-2 py-1 rounded-full' 
                            : 'text-gray-600 bg-gray-100 px-2 py-1 rounded-full'
                    }`}>
                        {slot.isChargerAvailable ? '⚡ Available' : '❌ N/A'}
                    </span>
                </div>
            )}

            {/* Action Button */}
            {slot.status !== 'Occupied' && (
                <button
                    onClick={handleStatusToggle}
                    className={`
                        w-full px-4 py-2.5 rounded-lg text-sm font-semibold 
                        transition-all duration-200 transform hover:scale-105 active:scale-95
                        ${styles.buttonClass}
                        shadow-sm hover:shadow-md
                    `}
                >
                    {styles.buttonText}
                </button>
            )}

            {/* Occupied slot info */}
            {slot.status === 'Occupied' && (
                <div className="bg-red-100 text-red-800 text-center py-2 rounded-lg text-sm font-medium">
                    Vehicle currently parked
                </div>
            )}
        </div>
    );
};

export default SlotCard;