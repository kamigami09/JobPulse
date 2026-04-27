export default function Login() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Login to JobPulse</h2>
                <div className="space-y-4">
                    <button className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition">
                        Continue as Dev User (Placeholder)
                    </button>
                    <p className="text-sm text-gray-500 text-center">
                        Authenticating currently uses a placeholder user ID.
                    </p>
                </div>
            </div>
        </div>
    );
}
