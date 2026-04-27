import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Settings() {
    const [settings, setSettings] = useState({ timezone: 'UTC' });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetch('http://localhost:5000/api/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
                setIsLoading(false);
            })
            .catch(err => {
                toast.error('Failed to load settings');
                setIsLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('http://localhost:5000/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (!res.ok) throw new Error('Failed to save settings');
            toast.success('Settings saved!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExport = () => {
        window.open('http://localhost:5000/api/settings/export', '_blank');
        toast.success('Export started!');
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete ALL your job data? This cannot be undone.')) return;

        try {
            const res = await fetch('http://localhost:5000/api/settings/delete-data', {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete data');
            toast.success('All data has been deleted.');
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (isLoading) return (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Preferences</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                        <select
                            value={settings.timezone}
                            onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                            className="w-full md:w-1/2 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        >
                            <option value="UTC">UTC</option>
                            <option value="America/New_York">Eastern Time (US)</option>
                            <option value="America/Chicago">Central Time (US)</option>
                            <option value="America/Denver">Mountain Time (US)</option>
                            <option value="America/Los_Angeles">Pacific Time (US)</option>
                            <option value="Europe/London">London</option>
                            <option value="Asia/Tokyo">Tokyo</option>
                        </select>
                    </div>
                </div>
                <div className="mt-6">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-gray-900 text-white px-5 py-2 rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Data Management</h2>
                <p className="text-gray-500 text-sm mb-6">Export your tracking data or permanently delete your account information.</p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleExport}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition shadow-sm"
                    >
                        Export as JSON
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition shadow-sm"
                    >
                        Delete All Data
                    </button>
                </div>
            </div>
        </div>
    );
}
