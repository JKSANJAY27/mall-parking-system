import React, { useState } from 'react';
import VehicleForm from '../components/VehicleForm';
import * as api from '../api';

const CheckIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [lastSessionDetails, setLastSessionDetails] = useState(null);

    const handleCheckIn = async (formData) => {
        setIsLoading(true);
        setMessage('');
        setIsError(false);
        setLastSessionDetails(null);

        try {
            const res = await api.checkInVehicle(formData);
            setMessage(res.data.msg);
            setIsError(false);
            setLastSessionDetails(res.data);
        } catch (err) {
            console.error('Check-in failed:', err.response?.data || err);
            setMessage(err.response?.data?.msg || 'An error occurred during check-in.');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateTime = (dateTime) => {
        return new Date(dateTime).toLocaleString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
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

    const handlePrintTicket = () => {
        if (lastSessionDetails) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Parking Ticket</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .ticket { max-width: 300px; margin: 0 auto; text-align: center; }
                            .header { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
                            .details { text-align: left; margin: 10px 0; }
                            .footer { margin-top: 20px; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="ticket">
                            <div class="header">🅿️ PARKING TICKET</div>
                            <div class="details">
                                <p><strong>Vehicle:</strong> ${lastSessionDetails.session.vehicleNumberPlate}</p>
                                <p><strong>Slot:</strong> ${lastSessionDetails.assignedSlot.slotNumber}</p>
                                <p><strong>Type:</strong> ${lastSessionDetails.assignedSlot.slotType}</p>
                                <p><strong>Entry:</strong> ${formatDateTime(lastSessionDetails.session.entryTime)}</p>
                                <p><strong>Billing:</strong> ${lastSessionDetails.session.billingType}</p>
                                ${lastSessionDetails.session.billingAmount ? `<p><strong>Amount:</strong> ₹${lastSessionDetails.session.billingAmount}</p>` : ''}
                            </div>
                            <div class="footer">Please keep this ticket safe</div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="relative">
            <VehicleForm
                onSubmit={handleCheckIn}
                isLoading={isLoading}
                message={message}
                isError={isError}
            />

            {/* Success Modal/Overlay */}
            {lastSessionDetails && !isError && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                            <div className="flex items-center justify-center">
                                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-2xl">✅</span>
                                </div>
                                <div className="text-white">
                                    <h3 className="text-xl font-bold">Check-in Successful!</h3>
                                    <p className="text-green-100 text-sm">Vehicle has been assigned a parking slot</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Vehicle Number Plate - Highlighted */}
                            <div className="text-center mb-6">
                                <div className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg font-mono text-lg font-bold tracking-wider">
                                    {lastSessionDetails.session.vehicleNumberPlate}
                                </div>
                            </div>

                            {/* Slot Assignment */}
                            <div className="bg-blue-50 rounded-lg p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <span className="text-2xl mr-3">{getSlotTypeIcon(lastSessionDetails.assignedSlot.slotType)}</span>
                                        <div>
                                            <p className="font-semibold text-gray-900">Assigned Slot</p>
                                            <p className="text-sm text-gray-600">{lastSessionDetails.assignedSlot.slotType}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-600">{lastSessionDetails.assignedSlot.slotNumber}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Session Details */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 flex items-center">
                                        <span className="mr-2">🕒</span>
                                        Entry Time
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {formatDateTime(lastSessionDetails.session.entryTime)}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-600 flex items-center">
                                        <span className="mr-2">💰</span>
                                        Billing Type
                                    </span>
                                    <span className="font-medium text-gray-900">
                                        {lastSessionDetails.session.billingType}
                                    </span>
                                </div>

                                {lastSessionDetails.session.billingAmount && (
                                    <div className="flex items-center justify-between py-2">
                                        <span className="text-gray-600 flex items-center">
                                            <span className="mr-2">💳</span>
                                            Amount Paid
                                        </span>
                                        <span className="font-bold text-green-600 text-lg">
                                            ₹{lastSessionDetails.session.billingAmount}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePrintTicket}
                                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
                                >
                                    <span className="mr-2">🖨️</span>
                                    Print Ticket
                                </button>
                                <button
                                    onClick={() => setLastSessionDetails(null)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <div className="bg-gray-50 px-6 py-3 text-center">
                            <p className="text-xs text-gray-500">
                                💡 Keep your ticket safe for exit verification
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckIn;