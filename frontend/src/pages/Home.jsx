import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-5xl font-extrabold text-blue-600 mb-4 tracking-tight">JobPulse</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md">
                Manage your job search like a pro. Track applications, organize details, and never miss an interview.
            </p>
            <div className="space-x-4">
                <Link
                    to="/app"
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                    Go to Dashboard
                </Link>
                <Link
                    to="/login"
                    className="text-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition border border-gray-200"
                >
                    Login
                </Link>
            </div>
        </div>
    );
}
