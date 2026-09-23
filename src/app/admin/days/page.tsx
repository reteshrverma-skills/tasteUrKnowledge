"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Day {
  id: string;
  label: string;
  content: string | null;
  subjectId: string;
  subject: {
    name: string;
    year: { name: string };
  };
}

interface Subject {
  id: string;
  name: string;
  year: { name: string };
}

export default function DaysPage() {
  const [days, setDays] = useState<Day[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    label: "",
    subjectId: "",
    content: "",
  });
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [daysRes, subjectsRes] = await Promise.all([
        fetch("/api/admin/days"),
        fetch("/api/admin/subjects"),
      ]);

      if (!daysRes.ok || !subjectsRes.ok) throw new Error("Failed to fetch");

      const daysData = await daysRes.json();
      const subjectsData = await subjectsRes.json();

      setDays(daysData);
      setSubjects(subjectsData);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/admin/days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create day");
      }

      setFormData({ label: "", subjectId: "", content: "" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this day? All questions will be deleted too.")) return;
    try {
      await fetch(`/api/admin/days/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      setError("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between">
          <Link href="/admin" className="text-purple-600 hover:text-purple-700 font-medium">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-purple-600">Manage Days</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Day</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day Label
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Day 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select a subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.year.name} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comprehension story{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="Passage shown above the questions. Leave blank for a plain quiz."
              />
              <p className="text-sm text-gray-500 mt-1">
                For English passages, use the{" "}
                <Link
                  href="/admin/english"
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  English Comprehension
                </Link>{" "}
                page to add the story and its questions together.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700"
            >
              Add Day
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-purple-600 text-white font-bold">
            Days List
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : days.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No days found</div>
          ) : (
            <div className="divide-y">
              {days.map((day) => (
                <div key={day.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-bold">{day.label}</p>
                    <p className="text-sm text-gray-600">
                      {day.subject.year.name} - {day.subject.name}
                      {day.content && (
                        <span className="ml-2 text-purple-600">
                          📖 has story
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(day.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
