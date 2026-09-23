import { getSessionOrThrow } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  // Middleware handles authentication and role check
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-purple-600">TasteUrKnowledge - Admin</h1>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-purple-600 font-medium"
            >
              Student Dashboard
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-gray-600 hover:text-red-600 font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Admin Panel</h2>
          <p className="text-gray-600 mt-2">Manage quiz content and platform settings</p>
        </div>

        {/* Admin Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            href="/admin/english"
            className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-[1.02]"
          >
            <h3 className="text-2xl font-bold">📖 English Comprehension</h3>
            <p className="mt-2 opacity-90">
              Add year-wise comprehension stories with their questions in one go
            </p>
          </Link>

          <Link
            href="/admin/years"
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
          >
            <h3 className="text-2xl font-bold">Years</h3>
            <p className="mt-2 opacity-90">Manage academic years</p>
          </Link>

          <Link
            href="/admin/subjects"
            className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
          >
            <h3 className="text-2xl font-bold">Subjects</h3>
            <p className="mt-2 opacity-90">Manage subjects</p>
          </Link>

          <Link
            href="/admin/days"
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
          >
            <h3 className="text-2xl font-bold">Days</h3>
            <p className="mt-2 opacity-90">Manage quiz days</p>
          </Link>

          <Link
            href="/admin/questions"
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-6 hover:shadow-xl transition transform hover:scale-105"
          >
            <h3 className="text-2xl font-bold">Questions</h3>
            <p className="mt-2 opacity-90">Manage questions</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
