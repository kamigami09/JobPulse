import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const [jobs, setJobs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchJobs = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/jobs');
            const data = await res.json();
            setJobs(data);
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await fetch(`http://localhost:5000/api/jobs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            // Optimistic update
            setJobs(jobs.map(j => j.id === id ? { ...j, status: newStatus } : j));
            toast.success(`Status updated to ${newStatus}`);
        } catch (err) {
            console.error('Failed to update status', err);
            toast.error('Failed to update status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Your Applications</h1>
                <Link to="/app/jobs/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
                    + Add Job
                </Link>
            </div>

            {jobs.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No jobs yet</h3>
                        <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                            You haven't added any job applications yet. Start tracking your journey by adding your first job.
                        </p>
                        <Link to="/app/jobs/new" className="text-blue-600 font-semibold hover:underline">
                            Paste a job URL
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 text-left">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Company</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Added</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {jobs.map(job => (
                                <tr key={job.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4">
                                        <Link to={`/app/jobs/${job.id}`} className="text-gray-900 font-medium hover:text-blue-600 hover:underline">
                                            {job.title || 'Unknown Title'}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {job.company || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={job.status}
                                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                                            className="bg-white text-sm font-medium border border-gray-300 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 cursor-pointer hover:border-blue-400"
                                        >
                                            <option value="SAVED">Saved</option>
                                            <option value="APPLIED">Applied</option>
                                            <option value="INTERVIEW">Interview</option>
                                            <option value="OFFER">Offer</option>
                                            <option value="REJECTED">Rejected</option>
                                            <option value="CLOSED">Closed</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm">
                                        {new Date(job.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
