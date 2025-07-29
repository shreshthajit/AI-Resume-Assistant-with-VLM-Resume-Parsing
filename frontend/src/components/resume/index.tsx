"use client";

import React from "react";

interface ParsedResume {
  contact_info: Record<string, any>;
  summary: string | null;
  education: any[];
  work_experience: any[];
  technical_skills: Record<string, any>;
  projects: any[];
}

function renderValue(val: any) {
  if (val === null || val === undefined || val === "") return "Missing";
  if (typeof val === "string" || typeof val === "number") return val;
  if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "Missing";
  try {
    return JSON.stringify(val);
  } catch {
    return "Object";
  }
}

function highlightMissing(val: any) {
  return val === null || val === undefined || val === "" ? "text-red-500 italic" : "";
}

export default function ResumeDisplay({ resume }: { resume: ParsedResume }) {
  return (
    <section className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow mb-6">
      <h2 className="text-xl font-semibold mb-4 text-blue-700">Parsed Resume Details</h2>

      {/* Contact Info */}
      <div className="mb-4">
        <h3 className="font-bold mb-2">Contact Info</h3>
        {Object.entries(resume.contact_info || {}).map(([key, val]) => (
          <div key={key}>
            <strong>{key.replace(/_/g, " ")}:</strong>{" "}
            <span className={highlightMissing(val)}>{renderValue(val)}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mb-4">
        <h3 className="font-bold mb-2">Summary</h3>
        <p className={highlightMissing(resume.summary)}>{renderValue(resume.summary)}</p>
      </div>

      {/* Education */}
      <div className="mb-4">
        <h3 className="font-bold mb-2">Education</h3>
        {resume.education?.length > 0 ? (
          resume.education.map((edu, index) => (
            <div key={index} className="mb-2">
              <p><strong>Institution:</strong> {renderValue(edu.institution)}</p>
              <p><strong>Degree:</strong> {renderValue(edu.degree)}</p>
              <p><strong>Dates:</strong> {renderValue(edu.dates)}</p>
            </div>
          ))
        ) : (
          <p className="text-red-500 italic">Missing</p>
        )}
      </div>

      {/* Work Experience */}
      <div className="mb-4">
        <h3 className="font-bold mb-2">Work Experience</h3>
        {resume.work_experience?.length > 0 ? (
          resume.work_experience.map((work, index) => (
            <div key={index} className="mb-2">
              <p><strong>Company:</strong> {renderValue(work.company)}</p>
              <p><strong>Position:</strong> {renderValue(work.position)}</p>
              <p><strong>Dates:</strong> {renderValue(work.dates)}</p>
              <p><strong>Description:</strong> {renderValue(work.description)}</p>
            </div>
          ))
        ) : (
          <p className="text-red-500 italic">Missing</p>
        )}
      </div>

      {/* Technical Skills */}
      <div className="mb-4">
        <h3 className="font-bold mb-2">Technical Skills</h3>
        {Object.entries(resume.technical_skills || {}).map(([key, val]) => (
          <div key={key}>
            <strong>{key.replace(/_/g, " ")}:</strong>{" "}
            <span className={highlightMissing(val)}>{renderValue(val)}</span>
          </div>
        ))}
      </div>

      {/* Projects */}
      <div className="mb-4">
        <h3 className="font-bold mb-2">Projects</h3>
        {resume.projects?.length > 0 ? (
          resume.projects.map((project, index) => (
            <div key={index} className="mb-2">
              <p><strong>Name:</strong> {renderValue(project.name)}</p>
              <p><strong>Description:</strong> {renderValue(project.description)}</p>
              <p><strong>Technologies:</strong> {renderValue(project.technologies)}</p>
            </div>
          ))
        ) : (
          <p className="text-red-500 italic">Missing</p>
        )}
      </div>
    </section>
  );
}
