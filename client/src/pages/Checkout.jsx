import React, { useState } from 'react';
import * as api from '../api';

const CheckOut = () => {
    const [numberPlate, setNumberPlate] = useState('');
    const [session, setSession] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [receipt, setReceipt] = useState(null);

    const formatDateTime = (dateTime) => {
        if (!dateTime) return 'N/A';
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

    const calculateDuration = (entry, exit) => {
        if (!entry || !exit) return 'N/A';
        const durationMs = new Date(exit).getTime() - new Date(entry).getTime();
        const durationMinutes = Math.ceil(durationMs / (1000 * 60)); 
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const getVehicleTypeIcon = (type) => {
        switch (type) {
            case 'Car': return '🚗';
            case 'Bike': return '🏍️';
            case 'EV': return '🔋';
            case 'Handicap Accessible': return '♿';
            default: return '❓';
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        setIsError(false);
        setSession(null);
        setReceipt(null);

        if (!numberPlate.trim()) {
            setMessage('Please enter a vehicle number plate to search.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            const res = await api.searchSession(numberPlate.toUpperCase());
            setSession(res.data);
            setMessage(`Active session found for ${res.data.vehicleNumberPlate}.`);
            setIsError(false);
        } catch (err) {
            console.error('Search failed:', err.response?.data || err);
            setSession(null);
            setMessage(err.response?.data?.msg || 'Failed to find active session. Ensure the number plate is correct or the vehicle is currently parked.');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckout = async () => {
        setIsLoading(true);
        setMessage('');
        setIsError(false);

        if (!session || !session._id) {
            setMessage('No active session selected for checkout.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        try {
            const res = await api.checkOutVehicle(session._id);
            setMessage(res.data.msg);
            setIsError(false);
            setReceipt(res.data.session);
            setSession(null); 
            setNumberPlate(''); 
        } catch (err) {
            console.error('Checkout failed:', err.response?.data || err);
            setMessage(err.response?.data?.msg || 'An error occurred during checkout. Please try again.');
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrintReceipt = () => {
        if (receipt) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Parking Receipt</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                            .receipt-container { max-width: 350px; margin: 0 auto; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; text-align: center; }
                            .header { font-size: 22px; font-weight: bold; margin-bottom: 15px; color: #2C3E50; }
                            .details { text-align: left; margin: 15px 0; font-size: 14px; }
                            .details p { margin-bottom: 8px; }
                            .strong-label { font-weight: bold; color: #555; }
                            .total { font-size: 26px; font-weight: bold; margin-top: 20px; color: #10B981; }
                            .footer { margin-top: 25px; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="receipt-container">
                            <div class="header">🅿️ Parking Receipt</div>
                            <div class="details">
                                <p><span class="strong-label">Vehicle:</span> ${receipt.vehicleNumberPlate}</p>
                                <p><span class="strong-label">Slot:</span> ${receipt.slot?.slotNumber || 'N/A'} (${receipt.slot?.slotType || 'N/A'})</p>
                                <p><span class="strong-label">Entry:</span> ${formatDateTime(receipt.entryTime)}</p>
                                <p><span class="strong-label">Exit:</span> ${formatDateTime(receipt.exitTime)}</p>
                                <p><span class="strong-label">Duration:</span> ${calculateDuration(receipt.entryTime, receipt.exitTime)}</p>
                                <p><span class="strong-label">Billing Type:</span> ${receipt.billingType}</p>
                            </div>
                            <div class="total">Total: ₹${receipt.billingAmount.toFixed(2)}</div>
                            <div class="footer">Thank you for parking with us!</div>
                        </div>
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    };


    return (
        <div className="w-full flex flex-col items-center gap-8 py-8">
            <h1 className="text-4xl font-bold text-gray-800">Check-Out Vehicle</h1>

            <form onSubmit={handleSearch} className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md space-y-6">
                <div>
                    <label htmlFor="searchNumberPlate" className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center">
                            <span className="text-xl mr-2">🚗</span>
                            Vehicle Number Plate:
                        </div>
                        <span className="text-xs text-gray-500">Enter the vehicle's registration number</span>
                    </label>
                    <input
                        type="text"
                        id="searchNumberPlate"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-lg uppercase"
                        value={numberPlate}
                        onChange={(e) => setNumberPlate(e.target.value.toUpperCase())}
                        placeholder="e.g., TN01AB1234"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center"
                >
                    {isLoading ? 'Searching...' : '🔍 Search Active Session'}
                </button>
                {message && !session && (
                    <p className={`mt-4 p-3 rounded-md text-center font-medium ${isError ? 'bg-red-100 text-red-700 border border-red-400' : 'bg-blue-100 text-blue-700 border border-blue-400'}`}>
                        {message}
                    </p>
                )}
            </form>

            {session && (
                <div className="bg-blue-50 border border-blue-300 text-blue-800 p-8 rounded-lg shadow-xl w-full max-w-md space-y-4">
                    <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">Session Found!</h3>
                    
                    <div className="text-center mb-6">
                        <div className="inline-block bg-gray-900 text-white px-5 py-2 rounded-lg font-mono text-xl font-bold tracking-wider">
                            {session.vehicleNumberPlate}
                        </div>
                    </div>

                    <div className="space-y-3 text-gray-700 text-base">
                        <p className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="font-medium">Vehicle Type:</span>
                            <span className="flex items-center">{getVehicleTypeIcon(session.vehicleType)} {session.vehicleType}</span>
                        </p>
                        <p className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="font-medium">Assigned Slot:</span>
                            <span className="font-semibold text-gray-900">{session.slot?.slotNumber} ({session.slot?.slotType})</span>
                        </p>
                        <p className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="font-medium">Entry Time:</span>
                            <span>{formatDateTime(session.entryTime)}</span>
                        </p>
                        <p className="flex justify-between items-center py-1">
                            <span className="font-medium">Billing Type:</span>
                            <span className="font-semibold text-gray-900">{session.billingType}</span>
                        </p>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={isLoading}
                        className="w-full mt-6 py-3 px-4 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center"
                    >
                        {isLoading ? 'Checking Out...' : '✅ Check-Out Vehicle'}
                    </button>
                    {message && session && (
                        <p className={`mt-4 p-3 rounded-md text-center font-medium ${isError ? 'bg-red-100 text-red-700 border border-red-400' : ''}`}>
                            {message}
                        </p>
                    )}
                </div>
            )}

            {receipt && (
                <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 p-8 rounded-lg shadow-xl w-full max-w-md space-y-4">
                    <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">Parking Receipt</h3>
                    
                    <div className="text-center mb-6">
                        <div className="inline-block bg-gray-900 text-white px-5 py-2 rounded-lg font-mono text-xl font-bold tracking-wider">
                            {receipt.vehicleNumberPlate}
                        </div>
                    </div>

                    <div className="space-y-3 text-gray-700 text-base">
                        <p className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="font-medium">Vehicle Type:</span>
                            <span className="flex items-center">{getVehicleTypeIcon(receipt.vehicleType)} {receipt.vehicleType}</span>
                        </p>
                        <p className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="font-medium">Assigned Slot:</span>
                            <span className="font-semibold text-gray-900">{receipt.slot?.slotNumber} ({receipt.slot?.slotType})</span>
                        </p>
                        <p className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="font-medium">Entry Time:</span>
                            <span>{formatDateTime(receipt.entryTime)}</span>
                        </p>
                        <p className="flex justify-between items-center py-1 border-b border-gray-200">
                            <span className="font-medium">Exit Time:</span>
                            <span>{formatDateTime(receipt.exitTime)}</span>
                        </p>
                        <p className="flex justify-between items-center py-1">
                            <span className="font-medium">Duration:</span>
                            <span className="font-semibold text-gray-900">{calculateDuration(receipt.entryTime, receipt.exitTime)}</span>
                        </p>
                    </div>

                    <div className="text-center mt-6 py-4 border-t border-gray-200">
                        <p className="text-xl text-gray-600">Total Amount:</p>
                        <p className="text-4xl font-extrabold text-green-700">₹{receipt.billingAmount.toFixed(2)}</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handlePrintReceipt}
                            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center text-base"
                        >
                            <span className="mr-2">🖨️</span>
                            Print Receipt
                        </button>
                        <button
                            onClick={() => setReceipt(null)}
                            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-base"
                        >
                            New Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CheckOut;