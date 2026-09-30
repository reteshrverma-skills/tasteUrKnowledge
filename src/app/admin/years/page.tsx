"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface Year {
  id: string;
  name: string;
  order: number;
}

export default function YearsPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", order: 0 });
  const [error, setError] = useState("");

  const fetchYears = async () => {
    try {
      const response = await fetch("/api/admin/years");
      if (!response.ok) throw new Error("Failed to fetch years");
      const data = await response.json();
      setYears(data);
    } catch (err) {
      console.error("Error fetching years:", err);
      setError("Failed to load years");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/admin/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create year");
      }

      setFormData({ name: "", order: 0 });
      fetchYears();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this year?")) return;

    try {
      const response = await fetch(`/api/admin/years/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete year");
      fetchYears();
    } catch (err) {
      setError("Failed to delete year");
    }
  };

  return (
    <div className="min-h-screen bg-ground">
      {/* Navigation */}
      <nav className="bg-surface border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/admin" className="text-brand hover:text-brand-hover font-medium">
            ← Back to Admin
          </Link>
          <h1 className="text-2xl font-bold text-brand">Manage Years</h1>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-ink mb-4">Add New Year</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">
                  Year Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                  placeholder="e.g., Year 6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-1">
                  Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-brand text-white py-2 rounded-lg font-medium hover:bg-brand-hover transition"
            >
              Add Year
            </button>
          </form>
        </div>

        {/* Years List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-brand text-white font-bold">
            Years List
          </div>
          {loading ? (
            <div className="p-6 text-center text-ink-soft">Loading...</div>
          ) : years.length === 0 ? (
            <div className="p-6 text-center text-ink-soft">No years found</div>
          ) : (
            <div className="divide-y">
              {years.map((year) => (
                <div
                  key={year.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <div>
                    <p className="font-bold text-ink">{year.name}</p>
                    <p className="text-sm text-ink-soft">Order: {year.order}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(year.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
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
