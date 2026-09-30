"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Subject {
  id: string;
  name: string;
  yearId: string;
  year: { name: string };
}

interface Year {
  id: string;
  name: string;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", yearId: "" });
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [subjectsRes, yearsRes] = await Promise.all([
        fetch("/api/admin/subjects"),
        fetch("/api/admin/years"),
      ]);

      if (!subjectsRes.ok || !yearsRes.ok) throw new Error("Failed to fetch");

      const subjectsData = await subjectsRes.json();
      const yearsData = await yearsRes.json();

      setSubjects(subjectsData);
      setYears(yearsData);
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
      const response = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create subject");
      }

      setFormData({ name: "", yearId: "" });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subject?")) return;
    try {
      await fetch(`/api/admin/subjects/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      setError("Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-ground">
      <nav className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between">
          <Link href="/admin" className="text-brand hover:text-brand-hover font-medium">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-brand">Manage Subjects</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-ink mb-4">Add New Subject</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  placeholder="e.g., English"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">
                  Year
                </label>
                <select
                  value={formData.yearId}
                  onChange={(e) => setFormData({ ...formData, yearId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                >
                  <option value="">Select a year</option>
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand-hover"
            >
              Add Subject
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-brand text-white font-bold">
            Subjects List
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : subjects.length === 0 ? (
            <div className="p-6 text-center text-ink-soft">No subjects found</div>
          ) : (
            <div className="divide-y">
              {subjects.map((subject) => (
                <div key={subject.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-bold">{subject.name}</p>
                    <p className="text-sm text-ink-soft">{subject.year.name}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(subject.id)}
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
