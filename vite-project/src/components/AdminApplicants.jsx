import { useState, useEffect } from "react";

export default function AdminApplicants({ jobId, token }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/jobs/${jobId}/applicants`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setApplicants(data.applicants || []);
        setLoading(false);
      });
  }, [jobId]);

  const handleSelect = async (applicationId, userId, jobTitle) => {
    const res = await fetch(`/api/applications/${applicationId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "selected" }),
    });
    if (res.ok) {
      setApplicants(prev =>
        prev.map(a =>
          a.application_id === applicationId ? { ...a, status: "selected" } : a
        )
      );
      alert(`✅ Candidate notified and marked as selected!`);
    }
  };

  const viewResume = async (userId) => {
    const res = await fetch(`/api/users/${userId}/resume`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      // Open resume text in a new window (for text/PDF-parsed content)
      const win = window.open("", "_blank");
      win.document.write(`<pre style="font-family:monospace;padding:20px">${data.resume.resume_text}</pre>`);
    } else {
      alert("No resume available");
    }
  };

  if (loading) return <p>Loading applicants...</p>;
  if (!applicants.length) return <p>No applicants yet.</p>;

  return (
    <div className="space-y-3">
      {applicants.map(a => (
        <div key={a.application_id} className="border rounded p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold">{a.name || a.email}</p>
            <p className="text-sm text-gray-500">{a.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              a.status === "selected"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}>
              {a.status || "pending"}
            </span>
          </div>
          <div className="flex gap-2">
            {a.resume_filename && (
              <button
                onClick={() => viewResume(a.user_id)}
                className="text-blue-600 underline text-sm"
              >
                View Resume
              </button>
            )}
            {a.status !== "selected" && (
              <button
                onClick={() => handleSelect(a.application_id, a.user_id)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                Select
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}