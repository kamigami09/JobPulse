import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AddJob() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('http://localhost:5000/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to add job');

            if (data.extraction_status && data.extraction_status !== 'success' && data.extraction_status !== 'manual') {
                toast.error('Failed to extract details automatically. Please fill them manually.');
                navigate(`/app/jobs/${data.id}`);
            } else {
                toast.success('Job created successfully!');
                navigate('/app');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Add new application</h1>
                <p className="text-gray-500">Paste the job URL and we'll try to extract the details for you.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job URL</label>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition outline-none"
                            placeholder="https://linkedin.com/jobs/..."
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
                    >
                        {isLoading ? 'Creating...' : 'Create Entry'}
                    </button>
                </form>
            </div>
        </div>
    );
}
