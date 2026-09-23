"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  day: {
    label: string;
    subject: {
      name: string;
      year: { name: string };
    };
  };
}

interface Day {
  id: string;
  label: string;
  subject: {
    name: string;
    year: { name: string };
  };
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOption: "A",
    dayId: "",
  });

  const fetchData = async () => {
    try {
      const [questionsRes, daysRes] = await Promise.all([
        fetch("/api/admin/questions"),
        fetch("/api/admin/days"),
      ]);

      if (!questionsRes.ok || !daysRes.ok) throw new Error("Failed to fetch");

      const questionsData = await questionsRes.json();
      const daysData = await daysRes.json();

      setQuestions(questionsData);
      setDays(daysData);
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
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create question");
      }

      setFormData({
        text: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOption: "A",
        dayId: "",
      });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
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
          <h1 className="text-2xl font-bold text-purple-600">Manage Questions</h1>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Add New Question</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Day
              </label>
              <select
                value={formData.dayId}
                onChange={(e) => setFormData({ ...formData, dayId: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select a day</option>
                {days.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.subject.year.name} - {day.subject.name} - {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Enter the question"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option A
                </label>
                <input
                  type="text"
                  value={formData.optionA}
                  onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option B
                </label>
                <input
                  type="text"
                  value={formData.optionB}
                  onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option C
                </label>
                <input
                  type="text"
                  value={formData.optionC}
                  onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Option D
                </label>
                <input
                  type="text"
                  value={formData.optionD}
                  onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correct Answer
              </label>
              <select
                value={formData.correctOption}
                onChange={(e) => setFormData({ ...formData, correctOption: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
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
              Add Question
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-purple-600 text-white font-bold">
            Questions List
          </div>
          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : questions.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No questions found</div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {questions.map((question) => (
                <div key={question.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{question.text}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {question.day.subject.year.name} - {question.day.subject.name} -{" "}
                        {question.day.label}
                      </p>
                      <div className="text-sm text-gray-600 mt-2">
                        <p>A: {question.optionA}</p>
                        <p>B: {question.optionB}</p>
                        <p>C: {question.optionC}</p>
                        <p>D: {question.optionD}</p>
                        <p className="font-semibold text-indigo-600">
                          Correct: {question.correctOption}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-4 flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
