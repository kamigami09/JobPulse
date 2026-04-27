import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function JobDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        title: '', company: '', location: '', status: '', notes: ''
    });

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${id}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        navigate('/app');
                        return;
                    }
                    throw new Error('Failed to load job');
                }
                const data = await res.json();
                setJob(data);
                setFormData({
                    title: data.title || '',
                    company: data.company || '',
                    location: data.location || '',
                    status: data.status || 'SAVED',
                    notes: data.notes || '',
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [id, navigate]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/jobs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error('Failed to save changes');
            const data = await res.json();
            setJob(data);
            toast.success('Changes saved!');
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Job Title"
                        className="text-3xl font-bold text-gray-900 w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 -ml-2 mb-2 transition"
                    />
                    <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Company Name"
                        className="text-lg text-gray-500 font-medium w-full bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 -ml-2 transition"
                    />
                </div>
                <div className="flex items-center space-x-4 mt-2">
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-semibold tracking-wider uppercase border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                        <option value="SAVED">Saved</option>
                        <option value="APPLIED">Applied</option>
                        <option value="INTERVIEW">Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="CLOSED">Closed</option>
                    </select>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Notes</h2>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full h-48 p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition resize-y"
                            placeholder="Add your notes about this role, interviews, or research..."
                        />
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Details</h2>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Location</p>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="e.g. Remote, New York..."
                                className="w-full text-gray-900 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition"
                            />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold mb-2">Original Posting</p>
                            <a
                                href={job.url_original}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-block text-center bg-gray-900 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition shadow-sm"
                                title={job.url_original}
                            >
                                Apply Now ↗
                            </a>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold mb-1">Added</p>
                            <p className="text-gray-900 text-sm">
                                {new Date(job.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
